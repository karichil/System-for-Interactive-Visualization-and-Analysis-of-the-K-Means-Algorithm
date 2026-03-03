import {Box, Button, Image, Input, NativeSelect, Slider, Text, Spinner} from "@chakra-ui/react";
import {toaster } from "../ui/toaster"
import React, { useState } from 'react';
import axios from 'axios';
import { ICentroidManagerDto, IDataPointDto, CentroidInitMode, IDataSetDto, IAlgorithmInitRequestDto, EditMode} from "../../types/interfaces";

const API_CENTROID_URL = "http://localhost:5075/api/CentroidManager";
const API_ALGORITM_URL = "http://localhost:5075/api/KMeansAlgoritm";


interface KMeansParametersProps {
    dataset: IDataSetDto | null;
    kValue: number;
    setKValue: (k: number) => void;

    metricName: string;
    maxIterations: number;
    initialCentroids: ICentroidManagerDto | null;

    setMetricName: (metricName: string) => void;
    setMaxIterations: (maxIterations: number) => void;
    setInitMode: (mode: CentroidInitMode) => void;
    setInitialCentroids: (centroids: ICentroidManagerDto | null) => void;
    setIsInitialized: (isInitialized: boolean) => void;
    setEditMode: (editMode: EditMode) => void;
    setIsModified: (isModified: boolean) => void;
    setFinalDataSet: (data: IDataSetDto | null) => void;
    isInitialized: boolean;
}


export default function KMeansParameters({
                                             dataset,
                                             kValue,
                                             setKValue,
                                             metricName,
                                             maxIterations,
                                             initialCentroids,
                                             setMetricName,
                                             setMaxIterations,
                                             setInitMode,
                                             setInitialCentroids,
                                             setIsInitialized, setEditMode, setIsModified, setFinalDataSet, isInitialized
                                         }: KMeansParametersProps) {

    const [isLoading, setIsLoading] = useState(false);
    const [localInitMode, setLocalInitMode] = useState<CentroidInitMode | "">("");
    const [localMaxIter, setLocalMaxIter] = useState("100");
    const hasCentroids = initialCentroids && initialCentroids.centroids && initialCentroids.centroids.length > 0;
    const reinitialize = !isInitialized && hasCentroids;
    const maxK = dataset?.points?.length ? Math.min(20, dataset.points.length) : 20;

    const handleReset = () => {
        setKValue(1);
        setMetricName("Euclidean");
        setMaxIterations(100);
        setInitMode("KMeansPlusPlus");
        setFinalDataSet(null);
        setLocalInitMode("");
        setInitialCentroids(null);
        setIsInitialized(false);
        axios.delete(`${API_CENTROID_URL}/clear-centroid`).catch(err => {
            console.error("Backend reset failed:", err);
        });
        toaster.info({title:"K-means parameters",description:"Initialization reset."})
    };

    const handleInitializeClick = async () => {

        if (!dataset) {
            alert("Please load the dataset first.");
            return;
        }
        if (!initialCentroids || initialCentroids.centroids.length === 0) {
            alert("Please initialize the centroids first (use KMeans++, Manual or Random).");
            return;
        }

        setIsLoading(true);

        const requestDto: IAlgorithmInitRequestDto = {
            DataSet: dataset,
            CentroidManager: initialCentroids,
            MaxIterations: maxIterations,
            MetricName: metricName
        };

        try {
            const response = await axios.post<IDataPointDto[]>(
                `${API_ALGORITM_URL}/initialize`,
                requestDto
            );
            setIsInitialized(true);
            setInitialCentroids({centroids: response.data});
            debugger;
            console.log("Centroids updated.", response.data);
            toaster.success({
                title: 'Initialization Finished.',
                description: (
                    <Box>
                        You can now run the algorithm.<br />
                        K: {kValue}<br />
                        Metric: {metricName}<br />
                        Iterations: {maxIterations}
                    </Box>
                ),
                duration: 5000,
                closable: true,
            });

        } catch (err) {
            console.error("Error while running the algorithm:", err);
            toaster.error({
                title: 'Algorithm Error',
                description: 'An error occurred while running the algorithm.',
                duration: 5000,
                closable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitModeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const mode = event.target.value as CentroidInitMode;
        setLocalInitMode(mode);
        setInitMode(mode);

        if (mode === "KMeansPlusPlus") {
            setEditMode(null);
            setIsModified(false);
            if (!dataset) {
                alert("First load the dataset to use KMeans++.");
                return;
            }
            setIsLoading(true);
            try {
                const response = await axios.post<IDataPointDto[]>(
                    `${API_CENTROID_URL}/init?mode=KMeansPlusPlus&k=${kValue}`,
                    dataset
                );
                setInitialCentroids({centroids: response.data});
            } catch (err) {
                console.error("KMeans++ initialization error", err);
            } finally {
                setIsLoading(false);
            }
        } else if (mode === "Manual") {
            setInitialCentroids(null);
            setIsModified(false);
            setEditMode('Centroids');
        }
        else if (mode === "Random") {
            setInitialCentroids(null);
            setIsModified(false);
            if (!dataset) {
                alert("First load the dataset to use Random.");
                return;
            }
            setIsLoading(true);
            try {
                const response = await axios.post<IDataPointDto[]>(
                    `${API_CENTROID_URL}/init?mode=Random&k=${kValue}`,
                    dataset
                );
                setInitialCentroids({centroids: response.data});
            } catch (err) {
                console.error("Random initialization error", err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSliderChange = (value: number[]) => {
        setKValue(value[0]);
    };

    const handleMaxIterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setLocalMaxIter(value);
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0) {
            setMaxIterations(numValue);
        }
    };

    return (
        <Box className={"App-group-box"}>
            <Box flexDirection="column" className="App-title-icon-box">
                <Box className={"App-title-icon-box"}>
                    <Image src="/icons/settingsControl.svg"/>
                    <Text className={"App-text-md"}>K-means parameters</Text>
                    {isLoading && <Spinner size="sm"/>}
                </Box>

                <Box flexDirection="row" display={"flex"} alignSelf="stretch" justifyContent={"space-between"}>
                    <Text className={"App-text-md"}>Clusters (k)</Text>
                    <Text className={"App-cluser-box"}>{kValue}</Text>
                </Box>

                <Slider.Root width="100%" size="sm" min={1} max={maxK} defaultValue={[1]} value={[kValue]}
                             onValueChange={(details: { value: number[] }) => handleSliderChange(details.value)}>
                    <Slider.Control>
                        <Slider.Track bg="gray.200">
                            <Slider.Range bg="rgba(135, 152, 0, 1)"/>
                        </Slider.Track>
                        <Slider.Thumb borderColor="rgba(135, 152, 0, 1)"/>
                    </Slider.Control>
                </Slider.Root>

                <Text className={"App-text-sm-medium"}>Initialization</Text>
                <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                        value={localInitMode}
                        placeholder="Select option"
                        onChange={handleInitModeChange}
                    >
                        <option value="KMeansPlusPlus">K-Means++</option>
                        <option value="Manual">Manual</option>
                        <option value="Random">Random</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator/>
                </NativeSelect.Root>

                <Button className={"App-button"} variant={"outline"} onClick={handleReset}><Image
                    src={"/icons/reset.svg"}/>Reset</Button>

                <Text className={"App-text-sm-medium"}>Metric</Text>
                <NativeSelect.Root
                    size="sm"
                    defaultValue="Euclidean"
                >
                    <NativeSelect.Field
                        onChange={(e) => setMetricName(e.target.value)}
                    >
                        <option value="Euclidean">Euclidean</option>
                        <option value="Manhattan">Manhattan</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator/>
                </NativeSelect.Root>

                <Text className={"App-text-sm-medium"}>Max iterations</Text>
                <Input
                    height={"32px"}
                    type="number"
                    value={localMaxIter}
                    onChange={handleMaxIterChange}
                />
            </Box>

            <Button
                className={"App-button"}
                variant={reinitialize ? "solid" : "outline"}
                onClick={handleInitializeClick}
                disabled={isLoading}
            >
                {isLoading ? <Spinner size="sm" mr={2}/> : (
                    <Image src="/icons/init.svg"
                           style={reinitialize ? { filter: "brightness(0) invert(1)" } : {}}
                    />
                )}
                {reinitialize ? "Re-Initialize" : "Initialize"}
            </Button>
        </Box>
    );
}
