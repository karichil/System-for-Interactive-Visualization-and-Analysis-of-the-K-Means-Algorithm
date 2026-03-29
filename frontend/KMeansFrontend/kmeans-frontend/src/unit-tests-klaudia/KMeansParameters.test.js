import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import KMeansParameters from '../components/ControlPanel/KMeansParameters';
import { toaster } from '../components/ui/toaster';

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
        Input: React.forwardRef((props, ref) => React.createElement('input', { ...props, ref })),
        Text: passthrough('span'),
        Spinner: () => React.createElement('div', { 'data-testid': 'spinner' }),
        NativeSelect: {
            Root: passthrough('div'),
            Field: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('select', { ...props, ref }, children)
            ),
            Indicator: () => null,
        },
        Slider: {
            Root: passthrough('div'),
            Control: passthrough('div'),
            Track: passthrough('div'),
            Range: passthrough('div'),
            Thumb: passthrough('div'),
        },
    };
});

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        delete: jest.fn(),
        post: jest.fn(),
    },
}));

jest.mock('../components/ui/toaster', () => ({
    toaster: {
        info: jest.fn(),
        success: jest.fn(),
        error: jest.fn(),
    },
}));

const mockedAxios = axios;

const createProps = (overrides = {}) => ({
    dataset: {
        points: [
            { x: 1, y: 2, clusterId: null },
            { x: 3, y: 4, clusterId: null },
        ],
    },
    kValue: 3,
    setKValue: jest.fn(),
    metricName: 'Euclidean',
    maxIterations: 100,
    initialCentroids: null,
    setMetricName: jest.fn(),
    setMaxIterations: jest.fn(),
    setInitMode: jest.fn(),
    setInitialCentroids: jest.fn(),
    setIsInitialized: jest.fn(),
    setEditMode: jest.fn(),
    setIsModified: jest.fn(),
    setFinalDataSet: jest.fn(),
    isInitialized: false,
    ...overrides,
});

describe('KMeansParameters', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedAxios.delete.mockResolvedValue({});
        mockedAxios.post.mockResolvedValue({ data: [] });
        window.alert = jest.fn();
    });

    test('renders the current controls and values', () => {
        render(<KMeansParameters {...createProps()} />);

        expect(screen.getByText(/k-means parameters/i)).toBeInTheDocument();
        expect(screen.getByText(/clusters \(k\)/i)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText(/max iterations/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('100')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /initialize/i })).toBeInTheDocument();
        expect(screen.getAllByRole('combobox')).toHaveLength(2);
    });

    test('updates max iterations when a positive value is typed', () => {
        const props = createProps();
        render(<KMeansParameters {...props} />);

        const input = screen.getByDisplayValue('100');
        fireEvent.change(input, { target: { value: '250' } });

        expect(props.setMaxIterations).toHaveBeenCalledWith(250);
        expect(input).toHaveValue(250);
    });

    test('does not update max iterations for invalid values', () => {
        const props = createProps();
        render(<KMeansParameters {...props} />);

        const input = screen.getByDisplayValue('100');
        fireEvent.change(input, { target: { value: '0' } });
        fireEvent.change(input, { target: { value: '-5' } });

        expect(props.setMaxIterations).not.toHaveBeenCalled();
        expect(input).toHaveValue(-5);
    });

    test('switches to manual initialization mode', () => {
        const props = createProps();
        render(<KMeansParameters {...props} />);

        const [initSelect] = screen.getAllByRole('combobox');
        fireEvent.change(initSelect, { target: { value: 'Manual' } });

        expect(props.setInitMode).toHaveBeenCalledWith('Manual');
        expect(props.setInitialCentroids).toHaveBeenCalledWith(null);
        expect(props.setIsModified).toHaveBeenCalledWith(false);
        expect(props.setEditMode).toHaveBeenCalledWith('Centroids');
    });

    test('updates metric when metric selection changes', () => {
        const props = createProps();
        render(<KMeansParameters {...props} />);

        const [, metricSelect] = screen.getAllByRole('combobox');
        fireEvent.change(metricSelect, { target: { value: 'Manhattan' } });

        expect(props.setMetricName).toHaveBeenCalledWith('Manhattan');
    });

    test('calls backend for random initialization when dataset exists', () => {
        const props = createProps();
        render(<KMeansParameters {...props} />);

        const [initSelect] = screen.getAllByRole('combobox');
        fireEvent.change(initSelect, { target: { value: 'Random' } });

        expect(props.setInitMode).toHaveBeenCalledWith('Random');
        expect(props.setInitialCentroids).toHaveBeenCalledWith(null);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:5075/api/CentroidManager/init?mode=Random&k=3',
            props.dataset
        );
    });

    test('shows an alert for random initialization without dataset', () => {
        render(<KMeansParameters {...createProps({ dataset: null })} />);

        const [initSelect] = screen.getAllByRole('combobox');
        fireEvent.change(initSelect, { target: { value: 'Random' } });

        expect(window.alert).toHaveBeenCalledWith('First load the dataset to use Random.');
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test('calls backend for K-Means++ initialization when dataset exists', () => {
        const props = createProps();
        render(<KMeansParameters {...props} />);

        const [initSelect] = screen.getAllByRole('combobox');
        fireEvent.change(initSelect, { target: { value: 'KMeansPlusPlus' } });

        expect(props.setInitMode).toHaveBeenCalledWith('KMeansPlusPlus');
        expect(props.setEditMode).toHaveBeenCalledWith(null);
        expect(props.setIsModified).toHaveBeenCalledWith(false);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:5075/api/CentroidManager/init?mode=KMeansPlusPlus&k=3',
            props.dataset
        );
    });

    test('resets values and clears backend centroids', () => {
        const props = createProps();
        render(<KMeansParameters {...props} />);

        fireEvent.click(screen.getByRole('button', { name: /reset/i }));

        expect(props.setKValue).toHaveBeenCalledWith(1);
        expect(props.setMetricName).toHaveBeenCalledWith('Euclidean');
        expect(props.setMaxIterations).toHaveBeenCalledWith(100);
        expect(props.setInitMode).toHaveBeenCalledWith('KMeansPlusPlus');
        expect(props.setFinalDataSet).toHaveBeenCalledWith(null);
        expect(props.setInitialCentroids).toHaveBeenCalledWith(null);
        expect(props.setIsInitialized).toHaveBeenCalledWith(false);
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            'http://localhost:5075/api/CentroidManager/clear-centroid'
        );
        expect(toaster.info).toHaveBeenCalled();
    });

    test('shows an alert when initialize is clicked without a dataset', () => {
        render(<KMeansParameters {...createProps({ dataset: null })} />);

        fireEvent.click(screen.getByRole('button', { name: /initialize/i }));

        expect(window.alert).toHaveBeenCalledWith('Please load the dataset first.');
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test('shows an alert when initialize is clicked without centroids', () => {
        render(<KMeansParameters {...createProps()} />);

        fireEvent.click(screen.getByRole('button', { name: /initialize/i }));

        expect(window.alert).toHaveBeenCalledWith(
            'Please initialize the centroids first (use KMeans++, Manual or Random).'
        );
        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test('initializes algorithm when dataset and centroids are provided', () => {
        const props = createProps({
            initialCentroids: {
                centroids: [{ x: 1, y: 2, clusterId: 0 }],
            },
        });
        render(<KMeansParameters {...props} />);

        fireEvent.click(screen.getByRole('button', { name: /re-initialize/i }));

        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:5075/api/KMeansAlgoritm/initialize',
            {
                DataSet: props.dataset,
                CentroidManager: props.initialCentroids,
                MaxIterations: 100,
                MetricName: 'Euclidean',
            }
        );
    });
});
