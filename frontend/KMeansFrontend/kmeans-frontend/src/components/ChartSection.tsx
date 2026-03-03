import React, { useRef, useEffect, useCallback, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Box, Text, Card } from "@chakra-ui/react";
import axios from 'axios';
import { toaster } from "./ui/toaster";
import {IDataPointDto,IDataSetDto, ICentroidManagerDto, CentroidInitMode, EditMode} from "../types/interfaces";

const CLUSTER_COLORS = [
    "#E6194B", "#AAFFC3", "#FFE119", "#4363D8", "#F58231",
    "#911EB4", "#42D4F4", "#3CB44B", "#BFEF45", "#FF69B4",
    "#469990", "#DCBEFF", "#9A6324", "#800000",
    "#808000", "#F032E6", "#FF7F50", "#000075", "#A9A9A9", "#D2F53C"
];
const UNASSIGNED_COLOR = '#808080';
const CENTROID_FALLBACK_COLOR = '#000000';

const API_DATA_URL = "http://localhost:5075/api/DataSet";
const API_CENTROID_URL = "http://localhost:5075/api/CentroidManager";

interface ChartSectionProps {
    data: IDataPointDto[];
    setBaseDataSet: (data: IDataSetDto | null) => void;
    initMode: CentroidInitMode;
    initialCentroids: ICentroidManagerDto | null;
    setInitialCentroids: (centroids: ICentroidManagerDto | null) => void;
    finalDataSet: IDataPointDto[];
    kValue: number;
    isModified: boolean;
    setIsModified: (isModified: boolean) => void;
    editMode: EditMode;
    setIsInitialized: (isInitialized: boolean) => void;
}
export default function ChartSection({ data,setBaseDataSet, initMode, kValue, initialCentroids, setInitialCentroids,finalDataSet, isModified, setIsModified, editMode, setIsInitialized }: ChartSectionProps) {

    const dataRef = useRef<IDataPointDto[]>(data);
    const centroidsRef = useRef<ICentroidManagerDto | null>(initialCentroids);
    const chartInstanceRef = useRef<any>(null);
    const isAlgoRunningRef = useRef<boolean>(false);

    const onZrClickRef = useRef<(params: any) => void>(() => {});
    const onZrMouseMoveRef = useRef<(params: any) => void>(() => {});
    const onZrMouseUpRef = useRef<(params: any) => void>(() => {});
    const onContextMenuRef = useRef<(params: any) => void>(() => {});

    const dragStateRef = useRef<{
        index: number | null;
        seriesIndex: number | null;
        isMoving: boolean;
    }>({ index: null, seriesIndex: null, isMoving: false });

    const [tooltipData, setTooltipData] = useState<{
        visible: boolean;
        x: number;
        y: number;
        content: any;
        type: 'Point' | 'Centroid';
    }>({visible: false, x: 0, y: 0, content: null, type: 'Point'});

    const [draggedIndexVisual, setDraggedIndexVisual] = useState<number | null>(null);

    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {dataRef.current = data;}, [data]);
    useEffect(() => {centroidsRef.current = initialCentroids;}, [initialCentroids]);

    const isAlgorithmRunning = (finalDataSet && finalDataSet.length > 0);

    useEffect(() => {
        isAlgoRunningRef.current = isAlgorithmRunning;
    }, [isAlgorithmRunning]);

    useEffect(() => {
        if (isAlgorithmRunning && isModified) {
            setIsModified(false);
        }
    }, [isAlgorithmRunning, setIsModified, isModified]);

    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);


    const handleDataChange = () => {
        setIsModified(true);
        setIsInitialized(false);
    };

    const onPointMouseOver = (params: any) => {
        if (dragStateRef.current.index !== null) return;
        const event = params.event?.event;
        setTooltipData({
            visible: true,
            x: (event?.offsetX || 0) + 15,
            y: (event?.offsetY || 0) + 15,
            content: params.data,
            type: params.seriesName === 'Centroids' ? 'Centroid' : 'Point'
        });
    };

    const onPointMouseMove = (params: any) => {
        if (dragStateRef.current.index === null) {
            const event = params.event?.event;
            setTooltipData(prev => ({
                ...prev,
                x: (event?.offsetX || 0) + 15,
                y: (event?.offsetY || 0) + 15,
            }));
        }
    };

    const onPointMouseOut = () => {
        if (dragStateRef.current.index === null) {
            setTooltipData(prev => ({...prev, visible: false}));
        }
    };

    const onPointMouseDown = (params: any) => {
        if (params.event && params.event.event && params.event.event.button === 2) return;
        if (!editMode) return;

        const isPoint = (editMode === 'Points' && params.seriesIndex === 0);
        const isCentroid = (editMode === 'Centroids' && params.seriesIndex === 1);

        if (isAlgoRunningRef.current && isPoint) {
            //toaster.warning({ title: "Blocked", description: "Reset algorithm to edit points.", duration: 1000 });
            return;
        }

        if (isPoint || isCentroid) {
            dragStateRef.current = {
                index: params.dataIndex,
                seriesIndex: params.seriesIndex,
                isMoving: false
            };
            setDraggedIndexVisual(params.dataIndex);
            setTooltipData(prev => ({ ...prev, visible: false }));
        }
    };

    const onPointToDelete = useCallback(async (params: any) => {
        if (params.event && params.event.event) {
            params.event.event.preventDefault();
            params.event.event.stopPropagation();
        }
        if (params.event && params.event.stop) params.event.stop();

        setTooltipData(prev => ({ ...prev, visible: false }));
        dragStateRef.current = { index: null, seriesIndex: null, isMoving: false };
        setDraggedIndexVisual(null);

        setIsDeleting(true);

        if (isAlgoRunningRef.current && params.seriesIndex === 0) {
            //toaster.warning({ title: "Blocked", description: "Reset algorithm to remove points.", duration: 1000 });
            return;
        }

        const indexToRemove = params.dataIndex;
        try {
            if (editMode === 'Points' && params.seriesIndex === 0) {
                const newData = dataRef.current.filter((_, index) => index !== indexToRemove);
                setBaseDataSet({ points: newData });
                await axios.delete(`${API_DATA_URL}/remove-point/${indexToRemove}`);
                handleDataChange();
                toaster.success({ title: "Point removed", duration: 1000 });

            } else if (editMode === 'Centroids' && params.seriesIndex === 1) {
                if (centroidsRef.current) {
                    const deletedCentroid = centroidsRef.current.centroids[indexToRemove];
                    const deletedClusterId = (deletedCentroid as any).clusterId ?? (deletedCentroid as any).ClusterId;

                    if (deletedClusterId !== undefined) {
                        const updatedPoints = dataRef.current.map(p => {
                            const pClusterId = (p.clusterId !== undefined ? p.clusterId : (p as any).ClusterId);
                            if (pClusterId === deletedClusterId) {
                                return { ...p, clusterId: -1 };
                            }
                            return p;
                        });
                        setBaseDataSet({ points: updatedPoints });
                    }

                    const newCentroidsList = centroidsRef.current.centroids.filter((_, i) => i !== indexToRemove);
                    setInitialCentroids({ centroids: newCentroidsList });

                    await axios.delete(`${API_CENTROID_URL}/remove-centroid/${indexToRemove}`);
                    handleDataChange();
                    toaster.success({ title: "Centroid removed", duration: 1000 });
                }
            }
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setTimeout(() => {
                setIsDeleting(false);
            }, 100);
        }
    }, [editMode, setBaseDataSet, setInitialCentroids, handleDataChange, isAlgorithmRunning]);

    const onZrMouseMove = useCallback((params: any) => {
        const { index, seriesIndex } = dragStateRef.current;
        if (index === null) return;

        const chart = chartInstanceRef.current;
        if (!chart) return;

        dragStateRef.current.isMoving = true;

        const pointInGrid = chart.convertFromPixel({gridIndex: 0}, [params.offsetX, params.offsetY]);

        if (pointInGrid) {
            const [newX, newY] = pointInGrid;

            if (seriesIndex === 0) {
                const newData = [...dataRef.current];
                if (newData[index]) {
                    newData[index] = {...newData[index], x: newX, y: newY, clusterId: -1};
                    setBaseDataSet({points: newData});
                }
            } else if (seriesIndex === 1 && centroidsRef.current) {
                const newCentroids = [...centroidsRef.current.centroids];
                if (newCentroids[index]) {
                    newCentroids[index] = {...newCentroids[index], x: newX, y: newY};
                    setInitialCentroids({centroids: newCentroids});
                }
            }
        }
    }, [setBaseDataSet, setInitialCentroids]);

    const onZrMouseUp = useCallback(async (params: any) => {
        const { index, seriesIndex, isMoving } = dragStateRef.current;

        if (index !== null && isMoving) {
            const chart = chartInstanceRef.current;
            const pointInGrid = chart.convertFromPixel({gridIndex: 0}, [params.offsetX, params.offsetY]);

            if (pointInGrid) {
                const [newX, newY] = pointInGrid;
                try {
                    if (seriesIndex === 0) {
                        await axios.put(`${API_DATA_URL}/update-point/${index}?newX=${newX}&newY=${newY}`);
                        toaster.success({title: "Point saved", duration: 500});
                    } else if (seriesIndex === 1 && centroidsRef.current) {
                        const centroidDto = centroidsRef.current.centroids[index];
                        await axios.post(`${API_CENTROID_URL}/update-centroid?newX=${newX}&newY=${newY}`, centroidDto);
                        toaster.success({title: "Centroid saved", duration: 500});
                    }
                    handleDataChange();
                } catch (error) {
                    console.error("Move error:", error);
                    toaster.error({title: "Move error"});
                }
            }
        }

        dragStateRef.current = { index: null, seriesIndex: null, isMoving: false };
        setDraggedIndexVisual(null);

    }, [setBaseDataSet, handleDataChange]);

    const onZrClick = useCallback(async (params: any) => {
        if (params.target) return;
        if (dragStateRef.current.isMoving || dragStateRef.current.index !== null) return;

        if (isAlgoRunningRef.current && params.seriesIndex === 0) {
            //toaster.warning({ title: "Bloced", description: "Reset algorithm to add points.", duration: 1000 });
            return;
        }

        const isManualInit = initMode?.trim() === "Manual";
        const isEditing = !!editMode;

        if (!isManualInit && !isEditing) return;

        const chartInstance = chartInstanceRef.current;
        if (!chartInstance) return;

        const pointInGrid = chartInstance.convertFromPixel({gridIndex: 0}, [params.offsetX, params.offsetY]);
        if (!pointInGrid) return;
        const [newX, newY] = pointInGrid;

        try {
            if (editMode === 'Points') {

                const newPointLocal: IDataPointDto = {x: newX, y: newY, clusterId: -1} as any;
                const newData = [...dataRef.current, newPointLocal];
                setBaseDataSet({points: newData});
                handleDataChange();
                await axios.post(`${API_DATA_URL}/add-point`, {X: newX, Y: newY, ClusterId: -1});
                toaster.success({title: "Point added", duration: 500});
            } else if (editMode === 'Centroids' || (isManualInit && !editMode)) {
                const currentCentroids = initialCentroids?.centroids || [];
                if (currentCentroids.length >= kValue) {
                    toaster.warning({title: "Limit reached", description: `Max ${kValue} centroids.`, duration: 1000});
                    return;
                }
                const usedIds = new Set(currentCentroids.map((c: any) => {
                    return (c.clusterId !== undefined ? c.clusterId : c.ClusterId);
                }));
                let newClusterId = 0;
                while (usedIds.has(newClusterId)) {
                    newClusterId++;
                }
                const newCentroid: IDataPointDto = { x: newX, y: newY, clusterId: newClusterId } as any;
                const newCentroidsList = [...currentCentroids, newCentroid];

                setInitialCentroids({ centroids: newCentroidsList });
                handleDataChange();
                await axios.post(`${API_CENTROID_URL}/add-centroid`, { X: newX, Y: newY, ClusterId: newClusterId });
                toaster.success({ title: "Centroid added", duration: 500 });
            }
        } catch (error) {
            console.error(error);
            toaster.error({title: "Addition error", duration: 500});
        }

    }, [initMode, editMode, kValue, initialCentroids, draggedIndex, setBaseDataSet, setInitialCentroids, handleDataChange, isAlgorithmRunning]);

    useEffect(() => {
        onZrClickRef.current = onZrClick;
        onZrMouseMoveRef.current = onZrMouseMove;
        onZrMouseUpRef.current = onZrMouseUp;
        onContextMenuRef.current = onPointToDelete;
    }, [onZrClick, onZrMouseMove, onZrMouseUp, onPointToDelete]);

    const pointsToDisplay = isAlgorithmRunning ? finalDataSet : data;

    const isAnimationEnabled = (draggedIndex === null) && !isDeleting;

    const option = {
        animation: isAnimationEnabled,
        grid: {left: '3%', right: '4%', bottom: '3%', containLabel: true},
        xAxis: {type: 'value', name: 'X', nameLocation: 'middle', nameGap: 25},
        yAxis: {type: 'value', name: 'Y', nameLocation: 'middle', nameGap: 35},
        tooltip: {show: false},
        series: [
            {
                name: 'Data Points',
                type: 'scatter',
                symbolSize: 8,
                universalTransition: !isDeleting,
                data: pointsToDisplay.map((p: any, index: number) => {
                    const xVal = p.X !== undefined ? p.X : p.x;
                    const yVal = p.Y !== undefined ? p.Y : p.y;
                    const cId = (p.ClusterId !== undefined ? p.ClusterId : p.clusterId) ?? -1;


                    const isSelected = (editMode === 'Points' && index === selectedPointIndex);
                    const isDragging = (editMode === 'Points' && index === draggedIndex);

                    return {
                        value: [xVal, yVal],
                        customData: {clusterId: cId},
                        itemStyle: {
                            color: cId > -1
                                ? CLUSTER_COLORS[cId % CLUSTER_COLORS.length]
                                : UNASSIGNED_COLOR,
                            borderColor: (isSelected || isDragging) ? 'red' : 'transparent',
                            borderWidth: (isSelected || isDragging) ? 2 : 0,
                            shadowBlur: isDragging ? 10 : 0
                        }
                    };
                })
            },
            {
                name: 'Centroids',
                type: 'scatter',
                symbol: 'circle',
                symbolSize: 12,
                universalTransition: true,
                data: (initialCentroids && Array.isArray(initialCentroids.centroids))
                    ? initialCentroids.centroids.map((centroid: any, index: number) => {
                        const xVal = centroid.X !== undefined ? centroid.X : centroid.x;
                        const yVal = centroid.Y !== undefined ? centroid.Y : centroid.y;
                        const cId = (centroid.ClusterId !== undefined ? centroid.ClusterId : centroid.clusterId) ?? -1;

                        const isSelected = (editMode === 'Centroids' && index === selectedPointIndex);
                        const isDragging = (editMode === 'Centroids' && index === draggedIndex);

                        return {
                            value: [xVal, yVal],
                            customData: {clusterId: cId,},
                            itemStyle: {
                                color: cId > -1
                                    ? CLUSTER_COLORS[cId % CLUSTER_COLORS.length]
                                    : CENTROID_FALLBACK_COLOR,

                                borderColor: (isSelected || isDragging) ? 'red' : '#000',
                                borderWidth: (isSelected || isDragging) ? 3 : 1.5,
                                shadowBlur: isDragging ? 10 : 0
                            }
                        };
                    })
                    : []
            }
        ]
    };

    const onEvents = {
        'mousedown': onPointMouseDown,
        'mouseover': onPointMouseOver,
        'mouseout': onPointMouseOut,
        'mousemove': onPointMouseMove
    };

    const onChartReady = (chartInstance: any) => {
        chartInstanceRef.current = chartInstance;
        const zr = chartInstance.getZr();

        zr.off('click');
        zr.off('mousemove');
        zr.off('mouseup');
        chartInstance.off('contextmenu');

        zr.on('click', (e: any) => onZrClickRef.current(e));
        zr.on('mousemove', (e: any) => onZrMouseMoveRef.current(e));
        zr.on('mouseup', (e: any) => onZrMouseUpRef.current(e));

        chartInstance.on('contextmenu', (params: any) => {
            onContextMenuRef.current(params);
        });
    };

    const renderTooltipContent = () => {
        if (!tooltipData.content || !tooltipData.content.customData) return null;

        const {content, type} = tooltipData;

        const valArr = Array.isArray(content.value) ? content.value : content.data?.value;
        if (!valArr) return null;

        const rawX = valArr[0];
        const rawY = valArr[1];
        const xDisplay = typeof rawX === 'number' ? rawX.toFixed(2) : rawX;
        const yDisplay = typeof rawY === 'number' ? rawY.toFixed(2) : rawY;

        const info = content.customData;
        const clusterId = info.clusterId !== undefined ? info.clusterId : -1;
        const cColor = clusterId > -1 ? CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length] : '#888';
        const cText = clusterId > -1 ? clusterId : 'Unassigned';

        return (
            <Box>
                <Text fontSize="xs" fontWeight="bold" mb={1}>{type}</Text>
                <Text fontSize="xs">X: {xDisplay}</Text>
                <Text fontSize="xs">Y: {yDisplay}</Text>
                <Text fontSize="xs" display="flex" alignItems="center" gap={1}>
                    Cluster: <Box as="span" w="8px" h="8px" borderRadius="full" bg={cColor}/> <b>{cText}</b>
                </Text>
                <Text fontSize="2xs" color="gray.500" mt={1}>Right click to delete</Text>
            </Box>
        );
    };

    return (
        <Box position="relative" w="100%" h="100%" minH="500px">
            <ReactECharts
                option={option}
                style={{height: '100%', width: '100%'}}
                onEvents={onEvents}
                onChartReady={onChartReady}
                notMerge={false}
            />

            {tooltipData.visible && (
                <Card.Root
                    position="absolute"
                    left={`${tooltipData.x}px`}
                    top={`${tooltipData.y}px`}
                    zIndex={100}
                    variant="elevated"
                    size="sm"
                    width="auto"
                    pointerEvents="none"
                    boxShadow="lg"
                    bg="white"
                >
                    <Card.Body p={2} gap={0}>
                        {renderTooltipContent()}
                    </Card.Body>
                </Card.Root>
            )}
        </Box>
    );
}