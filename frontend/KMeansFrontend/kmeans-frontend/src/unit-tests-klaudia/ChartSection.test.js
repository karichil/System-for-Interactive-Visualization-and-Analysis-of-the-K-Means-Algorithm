import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import ChartSection from '../components/ChartSection';
import { toaster } from '../components/ui/toaster';

let mockLatestChartProps;
let mockZrHandlers;
let mockChartHandlers;

jest.mock('@chakra-ui/react', () => {
    const React = require('react');

    const Box = React.forwardRef(({ children, as, ...props }, ref) =>
        React.createElement(as || 'div', { ...props, ref }, children)
    );
    const Text = React.forwardRef(({ children, ...props }, ref) =>
        React.createElement('span', { ...props, ref }, children)
    );
    const CardRoot = React.forwardRef(({ children, ...props }, ref) =>
        React.createElement('div', { ...props, ref }, children)
    );
    const CardBody = React.forwardRef(({ children, ...props }, ref) =>
        React.createElement('div', { ...props, ref }, children)
    );

    return {
        Box,
        Text,
        Card: {
            Root: CardRoot,
            Body: CardBody,
        },
    };
});

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    },
}));

jest.mock('../components/ui/toaster', () => ({
    toaster: {
        success: jest.fn(),
        error: jest.fn(),
        warning: jest.fn(),
    },
}));

jest.mock('echarts-for-react', () => {
    const React = require('react');

    return function MockReactECharts(props) {
        mockLatestChartProps = props;

        React.useEffect(() => {
            mockZrHandlers = {};
            mockChartHandlers = {};
            const mockChartInstance = {
                convertFromPixel: jest.fn((_grid, coords) => coords),
                getZr: () => ({
                    on: (event, handler) => {
                        mockZrHandlers[event] = handler;
                    },
                    off: jest.fn(),
                }),
                on: (event, handler) => {
                    mockChartHandlers[event] = handler;
                },
                off: jest.fn(),
            };

            if (props.onChartReady) {
                props.onChartReady(mockChartInstance);
            }
        }, [props.onChartReady]);

        return React.createElement('div', { 'data-testid': 'echarts' });
    };
});

const mockedAxios = axios;

const baseProps = (overrides = {}) => ({
    data: [
        { x: 1, y: 2, clusterId: -1 },
        { x: 3, y: 4, clusterId: 1 },
    ],
    setBaseDataSet: jest.fn(),
    initMode: '',
    initialCentroids: {
        centroids: [{ x: 10, y: 20, clusterId: 0 }],
    },
    setInitialCentroids: jest.fn(),
    finalDataSet: [],
    kValue: 3,
    isModified: false,
    setIsModified: jest.fn(),
    editMode: null,
    setIsInitialized: jest.fn(),
    ...overrides,
});

describe('ChartSection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLatestChartProps = undefined;
        mockZrHandlers = {};
        mockChartHandlers = {};
        mockedAxios.post.mockResolvedValue({});
        mockedAxios.put.mockResolvedValue({});
        mockedAxios.delete.mockResolvedValue({});
    });

    test('renders chart with point and centroid series', () => {
        render(<ChartSection {...baseProps()} />);

        expect(screen.getByTestId('echarts')).toBeInTheDocument();
        expect(mockLatestChartProps.option.series).toHaveLength(2);
        expect(mockLatestChartProps.option.series[0].data).toHaveLength(2);
        expect(mockLatestChartProps.option.series[1].data).toHaveLength(1);
    });

    test('uses finalDataSet when algorithm output is present', () => {
        render(<ChartSection {...baseProps({ finalDataSet: [{ x: 50, y: 60, clusterId: 2 }] })} />);

        expect(mockLatestChartProps.option.series[0].data[0].value).toEqual([50, 60]);
    });

    test('clears modified flag when algorithm is running', () => {
        const props = baseProps({
            isModified: true,
            finalDataSet: [{ x: 5, y: 6, clusterId: 0 }],
        });

        render(<ChartSection {...props} />);

        expect(props.setIsModified).toHaveBeenCalledWith(false);
    });

    test('shows tooltip on point hover', async () => {
        render(<ChartSection {...baseProps()} />);

        await act(async () => {
            mockLatestChartProps.onEvents.mouseover({
                seriesName: 'Data Points',
                data: { value: [1, 2], customData: { clusterId: 1 } },
                event: { event: { offsetX: 10, offsetY: 20 } },
            });
        });

        expect(screen.getByText('Point')).toBeInTheDocument();
        expect(screen.getByText('X: 1.00')).toBeInTheDocument();
        expect(screen.getByText('Y: 2.00')).toBeInTheDocument();
        expect(screen.getByText('Right click to delete')).toBeInTheDocument();
    });

    test('hides tooltip on mouse out', async () => {
        render(<ChartSection {...baseProps()} />);

        await act(async () => {
            mockLatestChartProps.onEvents.mouseover({
                seriesName: 'Data Points',
                data: { value: [1, 2], customData: { clusterId: -1 } },
                event: { event: { offsetX: 10, offsetY: 20 } },
            });
        });

        await act(async () => {
            mockLatestChartProps.onEvents.mouseout();
        });

        expect(screen.queryByText('Point')).not.toBeInTheDocument();
    });

    test('adds a point in points edit mode', async () => {
        const props = baseProps({ editMode: 'Points' });
        render(<ChartSection {...props} />);

        await act(async () => {
            mockZrHandlers.click({ offsetX: 8, offsetY: 9 });
        });

        expect(props.setBaseDataSet).toHaveBeenCalledWith({
            points: [...props.data, { x: 8, y: 9, clusterId: -1 }],
        });
        expect(props.setIsModified).toHaveBeenCalledWith(true);
        expect(props.setIsInitialized).toHaveBeenCalledWith(false);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:5075/api/DataSet/add-point',
            { X: 8, Y: 9, ClusterId: -1 }
        );
        expect(toaster.success).toHaveBeenCalledWith({ title: 'Point added', duration: 500 });
    });

    test('adds a centroid in manual mode', async () => {
        const props = baseProps({
            initMode: 'Manual',
            editMode: null,
            initialCentroids: { centroids: [{ x: 10, y: 20, clusterId: 0 }] },
        });
        render(<ChartSection {...props} />);

        await act(async () => {
            mockZrHandlers.click({ offsetX: 30, offsetY: 40 });
        });

        expect(props.setInitialCentroids).toHaveBeenCalledWith({
            centroids: [
                { x: 10, y: 20, clusterId: 0 },
                { x: 30, y: 40, clusterId: 1 },
            ],
        });
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'http://localhost:5075/api/CentroidManager/add-centroid',
            { X: 30, Y: 40, ClusterId: 1 }
        );
        expect(toaster.success).toHaveBeenCalledWith({ title: 'Centroid added', duration: 500 });
    });

    test('blocks centroid addition when limit is reached', async () => {
        const props = baseProps({
            initMode: 'Manual',
            kValue: 1,
            initialCentroids: { centroids: [{ x: 10, y: 20, clusterId: 0 }] },
        });
        render(<ChartSection {...props} />);

        await act(async () => {
            mockZrHandlers.click({ offsetX: 30, offsetY: 40 });
        });

        expect(props.setInitialCentroids).not.toHaveBeenCalled();
        expect(mockedAxios.post).not.toHaveBeenCalled();
        expect(toaster.warning).toHaveBeenCalledWith({
            title: 'Limit reached',
            description: 'Max 1 centroids.',
            duration: 1000,
        });
    });

    test('deletes a point from the chart in points edit mode', async () => {
        const props = baseProps({ editMode: 'Points' });
        render(<ChartSection {...props} />);

        await act(async () => {
            mockChartHandlers.contextmenu({
                seriesIndex: 0,
                dataIndex: 1,
                event: {
                    event: {
                        preventDefault: jest.fn(),
                        stopPropagation: jest.fn(),
                    },
                    stop: jest.fn(),
                },
            });
        });

        expect(props.setBaseDataSet).toHaveBeenCalledWith({
            points: [{ x: 1, y: 2, clusterId: -1 }],
        });
        expect(mockedAxios.delete).toHaveBeenCalledWith(
            'http://localhost:5075/api/DataSet/remove-point/1'
        );
        expect(toaster.success).toHaveBeenCalledWith({ title: 'Point removed', duration: 1000 });
    });

    test('moves a point and persists the new coordinates', async () => {
        const props = baseProps({ editMode: 'Points' });
        render(<ChartSection {...props} />);

        await act(async () => {
            mockLatestChartProps.onEvents.mousedown({
                seriesIndex: 0,
                dataIndex: 0,
                event: { event: { button: 0 } },
            });
        });

        await act(async () => {
            mockZrHandlers.mousemove({ offsetX: 15, offsetY: 25 });
        });

        expect(props.setBaseDataSet).toHaveBeenCalledWith({
            points: [
                { x: 15, y: 25, clusterId: -1 },
                { x: 3, y: 4, clusterId: 1 },
            ],
        });

        await act(async () => {
            mockZrHandlers.mouseup({ offsetX: 15, offsetY: 25 });
        });

        await waitFor(() => {
            expect(mockedAxios.put).toHaveBeenCalledWith(
                'http://localhost:5075/api/DataSet/update-point/0?newX=15&newY=25'
            );
        });
        expect(toaster.success).toHaveBeenCalledWith({ title: 'Point saved', duration: 500 });
    });
});
