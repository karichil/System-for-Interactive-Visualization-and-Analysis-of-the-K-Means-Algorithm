import {Box, Button, Popover, Portal, Image, Slider, Text, Spinner} from "@chakra-ui/react";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { IAlgorithmInitRequestDto, ICentroidManagerDto, IDataSetDto, IAlgorithmResultDto } from "../../types/interfaces";
import { toaster } from "../ui/toaster";
import {useSignalR} from "../../hooks/useSiganlR";

const API_ALGORITHM_URL = "http://localhost:5075/api/KMeansAlgoritm";
const HUB_URL = "http://localhost:5075/kmeansHub";

interface AlgorithmControlProps {
    dataset: IDataSetDto | null;
    metricName: string;
    maxIterations: number;
    initialCentroids: ICentroidManagerDto | null;
    setInitialCentroids: (centroids: ICentroidManagerDto | null) => void;
    setFinalDataSet: (data: IDataSetDto | null) => void;
    isInitialized: boolean;
    setIsInitialized: (val: boolean) => void;
    isModified: boolean;
    setIsModified: (val: boolean) => void;
}

export default function AlgorithmControl({dataset, metricName, maxIterations, initialCentroids, setInitialCentroids,setFinalDataSet, isInitialized, setIsInitialized, isModified, setIsModified}: AlgorithmControlProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIteration, setCurrentIteration] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [speed, setSpeed] =  useState<number>(1);
    const iterationRef = useRef(0);

    useEffect(() => {
        if (isInitialized) {
            setIsFinished(false);
            if (isModified) {
                setCurrentIteration(0);
                iterationRef.current = 0;
            }
        }
    }, [isInitialized]);

    const handleSignalRMessage = (result: IAlgorithmResultDto) => {
        const resData = result as any;
        const centroids = resData.centroids || resData.Centroids;
        const points = resData.points || resData.Points;
        const iteration = resData.iteration !== undefined ? resData.iteration : resData.Iteration;
        const finished = resData.isFinished !== undefined ? resData.isFinished : resData.IsFinished;
        iterationRef.current = iteration;

        setInitialCentroids({ centroids: centroids });
        setFinalDataSet({ points: points });
        setCurrentIteration(iteration);

        if (isModified) {
            setIsModified(false);
        }

        if (finished) {
            setIsFinished(true);
            setIsPlaying(false);
            toaster.success({ title: "Algorithm Converged!", description: `Terminated at iteration: ${iteration}`, duration:1000 });
        }
    };

    const handleSignalRFinished = (finished: boolean) => {
        if (finished) {
            setIsPlaying(false);
            setIsFinished(true);
            if (iterationRef.current >= maxIterations) {
                debugger;
                toaster.success({ title: "Max iterations reached." });
            } else {
                toaster.success({ title: "Algorithm Converged!", description: "Stopped early due to stability.", duration:1000 });
            }
        }
    };

    useSignalR(HUB_URL, handleSignalRMessage, handleSignalRFinished);

    const onFinishResult = async () => {
        if (!dataset || !initialCentroids) {
            toaster.warning({ title: 'No data available', description: 'Initialize algorithm first.' });
            return;
        }

        const requestDto: IAlgorithmInitRequestDto = {
            DataSet: dataset,
            CentroidManager: initialCentroids,
            MaxIterations: maxIterations,
            MetricName: metricName
        };

        console.log("Wysyłanie DTO do /finish-result:", requestDto);
        setIsLoading(true);

        try {
            const response = await axios.post<IAlgorithmResultDto>(`${API_ALGORITHM_URL}/finish-result`, requestDto);

            const resData = response.data as any;
            const centroids = resData.centroids || resData.Centroids;
            const points = resData.points || resData.Points;
            const iteration = resData.iteration !== undefined ? resData.iteration : resData.Iteration;
            const finished = resData.isFinished !== undefined ? resData.isFinished : resData.IsFinished;

            setInitialCentroids({ centroids: centroids });
            setFinalDataSet({ points: points });
            setCurrentIteration(iteration);
            setIsFinished(finished);
            if (isModified) setIsModified(false);

            if (finished) {
                toaster.success({ title: "Algorithm Converged!", description: `Terminated at iteration: ${iteration}`, duration:1000 });
            } else {
                toaster.success({ title: "Algorithm finished!", duration:1000 });
            }
        } catch (err: any) {
            console.error("Finish-result error:", err);
            toaster.error({ title: 'API error', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const onStepForward = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post<IAlgorithmResultDto>(`${API_ALGORITHM_URL}/step-forward`, null);

            const resData = response.data as any;
            const centroids = resData.centroids || resData.Centroids;
            const points = resData.points || resData.Points;
            const iteration = resData.iteration !== undefined ? resData.iteration : resData.Iteration;
            const finished = resData.isFinished !== undefined ? resData.isFinished : resData.IsFinished;

            setInitialCentroids({ centroids: centroids });
            setFinalDataSet({ points: points });
            setCurrentIteration(iteration);
            setIsFinished(finished);
            if (isModified) setIsModified(false);

            if (finished) {
                toaster.success({ title: "Algorithm Converged!", description: `Terminated at iteration: ${iteration}`, duration:1000 });
            } else {
                toaster.info({ title: "Step foreward.", duration: 500 });
            }
        } catch (err: any) {
            console.error("Step-forward error:", err);
            toaster.error({ title: 'API error', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const onStepBackward = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post<IAlgorithmResultDto>(`${API_ALGORITHM_URL}/step-backward`, null);

            const resData = response.data as any;
            const centroids = resData.centroids || resData.Centroids;
            const points = resData.points || resData.Points;
            const iteration = resData.iteration !== undefined ? resData.iteration : resData.Iteration;
            const finished = resData.isFinished !== undefined ? resData.isFinished : resData.IsFinished;

            setInitialCentroids({ centroids: centroids });
            setFinalDataSet({ points: points });
            setCurrentIteration(iteration);
            setIsFinished(finished);
            if (isModified) setIsModified(false);

            toaster.info({ title: "Step backward.", duration: 500 });
        } catch (err: any) {
            console.error("Step-backward error:", err);
            toaster.error({ title: 'API error', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const onReset = async () => {
        setIsLoading(true);
        try {
            await axios.post(`${API_ALGORITHM_URL}/clear`);

            setInitialCentroids(null);
            setFinalDataSet(null);
            setCurrentIteration(0);
            setIsFinished(false);
            setIsPlaying(false);
            setSpeed(1);

            setIsInitialized(false);

            toaster.success({ title: "Algorithm state reset.", duration:1000 });
        } catch (err: any) {
            console.error("Reset error:", err);
            toaster.error({ title: 'API error', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const onPlay = async () => {
        setIsFinished(false);

        if (!isPlaying) {

            if (!dataset || !initialCentroids) {
                toaster.warning({title: "No data to run."});
                return;
            }

            setIsLoading(true);

            try {
                if (currentIteration === 0) {
                    const requestDto = {
                        DataSet: {
                            Points: dataset.points.map((p: any) => ({
                                X: p.x !== undefined ? p.x : p.X,
                                Y: p.y !== undefined ? p.y : p.Y,
                                ClusterId: (p.clusterId !== undefined ? p.clusterId : p.ClusterId) ?? -1
                            }))
                        },
                        CentroidManager: {
                            Centroids: (initialCentroids.centroids || (initialCentroids as any).Centroids).map((p: any) => ({
                                X: p.x !== undefined ? p.x : p.X,
                                Y: p.y !== undefined ? p.y : p.Y,
                                ClusterId: (p.clusterId !== undefined ? p.clusterId : p.ClusterId) ?? -1
                            }))
                        },
                        MaxIterations: maxIterations,
                        MetricName: metricName
                    };
                    await axios.post(`${API_ALGORITHM_URL}/initialize`, requestDto);
                }

                await axios.post(`${API_ALGORITHM_URL}/run-intime?maxIterations=${maxIterations}&speed=${speed}`);

                setIsPlaying(true);
                setIsFinished(false);
                toaster.info({ title: "Auto-run started", duration: 500 });

            } catch (err: any) {
                console.error("Błąd run-intime:", err);
                toaster.error({ title: "Failed to start auto-run", description: err.message });
                setIsPlaying(false);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(true);
            try {
                await axios.post(`${API_ALGORITHM_URL}/play`);
                toaster.info({ title: "Algorithm resumed.", duration: 500 });
            } catch (err: any) {
                console.error("Play error:", err);
                toaster.error({ title: 'API eooer', description: err.message });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const onStop = async () => {
        setIsLoading(true);
        try {
            await axios.post(`${API_ALGORITHM_URL}/pause`);
            setIsPlaying(false);
            toaster.info({ title: "Algorytm zapauzowany.", duration: 500 });
        } catch (err: any) {
            console.error("Błąd pause:", err);
            toaster.error({ title: 'Błąd API', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box className={"App-group-box"}>
            <Box flexDirection={"row"} display={"flex"} alignSelf={"stretch"} justifyContent={"space-between"}>
                <Box className={"App-title-icon-box"}>
                    <Image src="/icons/startFill.svg"/>
                    <Text className={"App-text-md"}>Algorithm Control</Text>
                    {isLoading && <Spinner size="sm" color="blue.500" />}
                </Box>
                <Box>
                    <Popover.Root positioning={{ offset: { crossAxis: 0, mainAxis: 0 } }}>
                        <Popover.Trigger asChild>
                            <Image src="/icons/infoGreen.svg"/>
                        </Popover.Trigger>
                        <Portal>
                            <Popover.Positioner>
                                <Popover.Content>
                                    <Popover.Arrow />
                                    <Popover.Body>
                                        • <b>In time</b> - use Play and Stop,<br/>
                                        • <b>Step by step</b> - use arrows to go forward and backward,<br/>
                                        • <b>Finish result</b> - runs to the end,<br/>
                                        • <b>Reset</b> - use for reset algorithm run
                                    </Popover.Body>
                                </Popover.Content>
                            </Popover.Positioner>
                        </Portal>
                    </Popover.Root>
                </Box>
            </Box>

            <Box flexDirection={"column"} gap={"2"} display={"flex"} justifyContent="space-between" alignItems={"center"} alignSelf={"stretch"}>
                <Box flexDirection="row" display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} gap={"4px"}>
                    <Button
                        className={"App-button"}
                        flex={"1"}
                        size={"sm"}
                        onClick={onPlay}
                        disabled={!isInitialized || isFinished}
                        // STYL:
                        bg={isPlaying ? "green.600" : "black"}
                        color="white"
                        _hover={{ bg: isPlaying ? "green.700" : "gray.800" }}
                        _disabled={{ opacity: 0.4, cursor: "not-allowed", bg: "gray.400" }}
                    >
                        {isPlaying ? <Spinner size="xs" mr={1} /> : <Image src="/icons/startOutline.svg"  />}
                        {isPlaying ? "Running..." : "Play"}
                    </Button>
                    <Button
                        className={"App-button"}
                        flex={"1"}
                        size={"sm"}
                        onClick={onStop}
                        disabled={!isPlaying}
                        variant="outline"
                        borderColor="black"
                        borderWidth="2px"
                        color="black"
                        _hover={{ bg: "gray.100" }}
                        _disabled={{ opacity: 0.3, borderColor: "gray.300", color: "gray.400" }}
                    >
                        <Image src="/icons/stopOutline.svg"/>Stop
                    </Button>
                </Box>
                <Box flexDirection="row" display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} gap={"4px"}>
                    <Box display={"flex"}  gap={"2px"} alignItems={"center"} justifyContent={"center"} flex="1">
                        <Button className={"App-button"} flex="1" size={"sm"} onClick={onStepBackward} disabled={!isInitialized || currentIteration <= 0 || isPlaying || isFinished}>
                            <Image src="/icons/backwardsOutline.svg"/>
                        </Button>
                        <Button className={"App-button"} flex="1" size={"sm"} disabled={!isInitialized || isFinished || isPlaying} onClick={onStepForward}>
                            <Image src="/icons/forwardOutline.svg"/>
                        </Button>
                    </Box>
                    <Button className={"App-button"} flex={"1"} variant={"outline"} size={"sm"} onClick={onReset} disabled={!isInitialized}>
                        <Image src="/icons/reset.svg"/>Reset
                    </Button>
                </Box>
            </Box>

            <Button className={"App-button"} variant={"outline"} onClick={onFinishResult} disabled={!isInitialized || isFinished || isPlaying}>
                <Image src="/icons/target.svg"/> Finish result
            </Button>

            <Box flexDirection="row" display={"flex"} alignSelf="stretch" justifyContent={"space-between"}>
                <Text className={"App-text-md"}>Animation speed</Text>
                <Text className={"App-cluser-box"}>{speed}</Text>
            </Box>
            <Slider.Root width="100%" min={0.25} max={2.0} step={0.25} defaultValue={[1]} size={"sm"} value={[speed]}
                         onValueChange={(details: { value: number[] }) => setSpeed(details.value[0])} disabled={!isInitialized}>
                <Slider.Control>
                    <Slider.Track bg="gray.200">
                        <Slider.Range bg="rgba(135, 152, 0, 1)" />
                    </Slider.Track>
                    <Slider.Thumb borderColor="rgba(135, 152, 0, 1)" />
                </Slider.Control>
            </Slider.Root>
            <Box className={"App-info-box"} alignSelf={"stretch"}>
                <Text className={"App-text-sm-normal"}>Iteration: {currentIteration}</Text>
            </Box>
        </Box>
    );
}