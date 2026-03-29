import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AnalysisSection from '../components/AnalysisSection';
import { toaster } from '../components/ui/toaster';

let mockComposedChartProps;
let mockTooltipProps;
let mockReferenceLines;

jest.mock('@chakra-ui/react', () => {
    const React = require('react');

    const passthrough = (Tag = 'div') =>
        React.forwardRef(({ children, ...props }, ref) =>
            React.createElement(Tag, { ...props, ref }, children)
        );

    return {
        Box: passthrough('div'),
        Button: React.forwardRef(({ children, disabled, ...props }, ref) =>
            React.createElement('button', { ...props, disabled, ref }, children)
        ),
        Image: React.forwardRef((props, ref) => React.createElement('img', { ...props, ref })),
        Text: passthrough('span'),
        Spinner: () => React.createElement('div', { 'data-testid': 'spinner' }),
        Separator: passthrough('hr'),
        HStack: passthrough('div'),
    };
});

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
    },
}));

jest.mock('../components/ui/toaster', () => ({
    toaster: {
        success: jest.fn(),
        error: jest.fn(),
        warning: jest.fn(),
    },
}));

jest.mock('recharts', () => {
    const React = require('react');
    const passthrough = (name) =>
        function Component(props) {
            return React.createElement('div', { 'data-testid': name }, props.children);
        };

    return {
        ResponsiveContainer: passthrough('responsive-container'),
        CartesianGrid: passthrough('cartesian-grid'),
        XAxis: passthrough('x-axis'),
        YAxis: passthrough('y-axis'),
        Line: passthrough('line'),
        Legend: passthrough('legend'),
        Label: passthrough('label'),
        Scatter: function Scatter(props) {
            return React.createElement('div', { 'data-testid': `scatter-${props.name}` });
        },
        ReferenceLine: function ReferenceLine(props) {
            mockReferenceLines.push(props);
            return React.createElement('div', { 'data-testid': `reference-line-${props.x}` });
        },
        Tooltip: function Tooltip(props) {
            mockTooltipProps = props;
            return React.createElement('div', { 'data-testid': 'tooltip' });
        },
        ComposedChart: function ComposedChart(props) {
            mockComposedChartProps = props;
            return React.createElement('div', { 'data-testid': 'composed-chart' }, props.children);
        },
    };
});

const mockedAxios = axios;

const benchmarkResponse = {
    elbow: {
        bestK: 3,
        points: [
            { k: 2, value: 10 },
            { k: 3, value: 7 },
            { k: 4, value: 5 },
        ],
    },
    silhouette: {
        bestK: 4,
        points: [
            { k: 2, value: 0.2 },
            { k: 3, value: 0.3 },
            { k: 4, value: 0.45 },
        ],
    },
    calinskiHarabasz: {
        bestK: 2,
        points: [
            { k: 2, value: 15 },
            { k: 3, value: 10 },
            { k: 4, value: 9 },
        ],
    },
};

const userResponse = {
    silhouetteScore: 0.33,
    calinskiHarabasz: 11.5,
};

const createProps = (overrides = {}) => ({
    dataSet: {
        points: [
            { x: 1, y: 2, clusterId: 0 },
            { x: 3, y: 4, clusterId: 1 },
        ],
    },
    kValue: 3,
    isModified: false,
    ...overrides,
});

describe('AnalysisSection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockComposedChartProps = undefined;
        mockTooltipProps = undefined;
        mockReferenceLines = [];
        mockedAxios.post
            .mockResolvedValueOnce({ data: benchmarkResponse })
            .mockResolvedValueOnce({ data: userResponse });
    });

    test('renders header and disabled button without dataset', () => {
        render(<AnalysisSection {...createProps({ dataSet: null })} />);

        expect(screen.getByText(/clustering quality analysis/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /run analysis/i })).toBeDisabled();
    });

    test('calls both analysis endpoints with transformed payload', async () => {
        render(<AnalysisSection {...createProps()} />);

        fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenNthCalledWith(
                1,
                'http://localhost:5075/api/ClusteringResults/best-results',
                {
                    Points: [
                        { X: 1, Y: 2, ClusterId: 0 },
                        { X: 3, Y: 4, ClusterId: 1 },
                    ],
                }
            );
        });

        expect(mockedAxios.post).toHaveBeenNthCalledWith(
            2,
            'http://localhost:5075/api/ClusteringResults/algorithm-results',
            {
                DataSet: {
                    Points: [
                        { X: 1, Y: 2, ClusterId: 0 },
                        { X: 3, Y: 4, ClusterId: 1 },
                    ],
                },
                K: 3,
            }
        );
    });

    test('shows analysis content after successful run', async () => {
        render(<AnalysisSection {...createProps()} />);

        fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));

        expect(await screen.findByText(/best results for dataset/i)).toBeInTheDocument();
        expect(toaster.success).toHaveBeenCalledWith({ title: 'Analysis complete' });
    });

    test('renders elbow method description by default', async () => {
        render(<AnalysisSection {...createProps()} />);

        fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));

        expect(await screen.findByText('Elbow Method')).toBeInTheDocument();
        expect(screen.getByText(/sum of squared errors/i)).toBeInTheDocument();
        expect(mockComposedChartProps.data).toEqual([
            { k: 2, benchmark: 10, userScore: null, optimalPoint: null },
            { k: 3, benchmark: 7, userScore: 7, optimalPoint: 7 },
            { k: 4, benchmark: 5, userScore: null, optimalPoint: null },
        ]);
    });

    test('switches to silhouette method and updates chart data', async () => {
        render(<AnalysisSection {...createProps()} />);

        fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));
        await screen.findByText(/best results for dataset/i);

        fireEvent.click(screen.getByRole('button', { name: /^silhouette$/i }));

        expect(screen.getByText('Silhouette Score')).toBeInTheDocument();
        expect(screen.getByText(/range -1 to \+1/i)).toBeInTheDocument();
        expect(mockComposedChartProps.data).toEqual([
            { k: 2, benchmark: 0.2, userScore: null, optimalPoint: null },
            { k: 3, benchmark: 0.3, userScore: 0.33, optimalPoint: null },
            { k: 4, benchmark: 0.45, userScore: null, optimalPoint: 0.45 },
        ]);
    });

    test('switches to calinski harabasz method and updates chart data', async () => {
        render(<AnalysisSection {...createProps()} />);

        fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));
        await screen.findByText(/best results for dataset/i);

        fireEvent.click(screen.getByRole('button', { name: /calinski-harabasz/i }));

        expect(screen.getByText('Calinski-Harabasz Index')).toBeInTheDocument();
        expect(screen.getByText(/higher is better/i)).toBeInTheDocument();
        expect(mockComposedChartProps.data).toEqual([
            { k: 2, benchmark: 15, userScore: null, optimalPoint: 15 },
            { k: 3, benchmark: 10, userScore: 11.5, optimalPoint: null },
            { k: 4, benchmark: 9, userScore: null, optimalPoint: null },
        ]);
    });

    test('renders reference lines for best result and current k', async () => {
        render(<AnalysisSection {...createProps()} />);

        fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));

        await screen.findByText(/best results for dataset/i);

        expect(mockReferenceLines.map((line) => line.x)).toEqual(expect.arrayContaining([3, 3]));
    });

    test('passes custom tooltip component to recharts', async () => {
        render(<AnalysisSection {...createProps()} />);

        fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));

        await screen.findByText(/best results for dataset/i);

        expect(mockTooltipProps.content).toBeTruthy();
    });

    test('shows loading state while analysis is running', async () => {
        let resolveSecond;
        mockedAxios.post
            .mockReset()
            .mockResolvedValueOnce({ data: benchmarkResponse })
            .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));

        render(<AnalysisSection {...createProps()} />);

        fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));

        expect(screen.getByText(/running/i)).toBeInTheDocument();
        expect(screen.getByTestId('spinner')).toBeInTheDocument();

        await waitFor(() => {
            expect(resolveSecond).toBeDefined();
        });
        resolveSecond({ data: userResponse });

        await screen.findByText(/best results for dataset/i);
    });

    test('shows error toast when request fails', async () => {
        mockedAxios.post.mockReset().mockRejectedValueOnce({
            message: 'Request failed',
            response: { data: 'Server error' },
        });

        render(<AnalysisSection {...createProps()} />);

        fireEvent.click(screen.getByRole('button', { name: /run analysis/i }));

        await waitFor(() => {
            expect(toaster.error).toHaveBeenCalledWith({
                title: 'Analysis failed',
                description: 'Server error',
            });
        });
    });
});
