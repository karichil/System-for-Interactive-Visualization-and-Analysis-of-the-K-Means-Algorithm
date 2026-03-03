import {
    Box, Button, FileUpload, Heading, Icon, Image, NativeSelect, Text,
    Spinner, Alert, CloseButton, Popover, Portal
} from "@chakra-ui/react";
import React, { useState } from "react";
import axios from 'axios';
import { IDataSetDto, IFileProcessResultDto, IDataSetRequestDto, IDataPointDto } from "../../types/interfaces";
import {toaster} from "../ui/toaster";

const API_FILE_URL = "http://localhost:5075/api/FileManager";
const API_DATA_URL = "http://localhost:5075/api/DataSet";

type DataSetMode = "Example" | "OwnData";

const EXAMPLE_DATA_INFO: Record<string, { name: string, description: string, path: string }> = {
    "grid": {
        name: "Grid Dataset",
        description: "A dataset with points arranged in a grid pattern.",
        path: "ExampleData/grid.csv"
    },
    "grupped": {
        name: "Grupped Dataset",
        description: "Points clustered in distinct groups.",
        path: "ExampleData/grupped.csv"
    },
    "scattered": {
        name: "Scattered Dataset",
        description: "Randomly scattered points.",
        path: "ExampleData/scattered.csv"
    }
};

interface DataSetSectionProps {
    setBaseDataSet: (data: IDataSetDto | null) => void;
    isModified: boolean;
    setIsModified: (isModified: boolean) => void;
    dataset: IDataSetDto | null;
    finalDataSet: IDataPointDto[];
}

export default function DataSetSection({ setBaseDataSet, isModified, setIsModified , dataset, finalDataSet}: DataSetSectionProps) {

    const [rawProcessedData, setRawProcessedData] = useState<number[][] | null>(null);
    const [availableAxes, setAvailableAxes] = useState<string[]>([]);
    const [selectedX, setSelectedX] = useState<number>(0);
    const [selectedY, setSelectedY] = useState<number>(1);
    const [selectedExampleInfo, setSelectedExampleInfo] = useState<{ name: string, description: string } | null>(null);
    const [dataSetMode, setDataSetMode] = useState<DataSetMode | null>(null);
    const [baseDataSet, setLocalBaseDataSet] = useState<IDataSetDto | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedExample, setSelectedExample] = useState("");
    const [fileUploadKey, setFileUploadKey] = useState(Date.now());

    const isAlgorithmRunning = (finalDataSet && finalDataSet.length > 0);

    const createDataSet = async (data: number[][], xIndex: number, yIndex: number, rawDataDirectly?: string[][]) => {
        setError(null);
        setIsLoading(true);

        try {
            const requestBody: IDataSetRequestDto = {
                data: data,
                x: xIndex,
                y: yIndex,
            };

            const response = await axios.post<IDataSetDto>(`${API_DATA_URL}/create`, requestBody);

            setBaseDataSet(response.data);
            setLocalBaseDataSet(response.data);
            setRawProcessedData(data);
            setSelectedX(xIndex);
            setSelectedY(yIndex);

        } catch (err: any) {
            setError("Failed to create dataset. " + (err.response?.data || err.message));
            setBaseDataSet(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (details: { files: File[] }) => {
        const files = details.files;

        if (!files || files.length === 0) {
            console.log("No files selected.");
            return;
        }

        const file = files[0];

        console.log("Correct file upload:", file);

        const formData = new FormData();
        formData.append("file", file);

        setError(null);
        setIsLoading(true);
        setDataSetMode("OwnData");
        setSelectedExampleInfo(null);

        try {
            const response = await axios.post<IFileProcessResultDto>(
                `${API_FILE_URL}/upload`,formData);

            const headers = response.data.headers;
            const processedData = response.data.processedData;

            setAvailableAxes(headers);

            await createDataSet(processedData, 0, 1);

        } catch (err: any) {
            setError("File upload failed. " + (err.response?.data || err.message));
            setBaseDataSet(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExampleDataSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setSelectedExample(value);
        if (!value) {
            handleReset();
            return;
        }

        const info = EXAMPLE_DATA_INFO[value];
        setError(null);
        setIsLoading(true);
        setDataSetMode("Example");
        setSelectedExampleInfo(info);

        try {
            const response = await axios.get<IFileProcessResultDto>(
                `${API_FILE_URL}/load?path=${info.path}`);
            const headers = response.data.headers;
            const processedData = response.data.processedData;

            setAvailableAxes(headers);
            await createDataSet(processedData, 0, 1);

        } catch (err: any) {
            setError("Failed to load example data. " + (err.response?.data || err.message));
            setBaseDataSet(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAxisChange = async (axis: 'X' | 'Y', newIndex: number) => {
        if (!rawProcessedData) return;

        const newX = (axis === 'X') ? newIndex : selectedX;
        const newY = (axis === 'Y') ? newIndex : selectedY;

        setSelectedX(newX);
        setSelectedY(newY);

        setError(null);
        setIsLoading(true);
        try {
            const requestBody: IDataSetRequestDto = {
                data: rawProcessedData,
                x: newX,
                y: newY,
            };
            debugger;

            const response = await axios.put<IDataSetDto>(`${API_DATA_URL}/update-axes`, requestBody);
            setBaseDataSet(response.data);

        } catch (err: any) {
            setError("Failed to update axes. " + (err.response?.data || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setBaseDataSet(null);
        setRawProcessedData(null);
        setAvailableAxes([]);
        setSelectedX(0);
        setSelectedY(1);
        setSelectedExampleInfo(null);
        setDataSetMode(null);
        setError(null);
        setIsModified(false);
        setSelectedExample("");
        setFileUploadKey(Date.now());
        axios.delete(`${API_DATA_URL}/reset-data`).catch(err => {
            console.error("Backend reset failed:", err);
        });
        toaster.info({ title: "Dataset", description: "Dataset reset successfully." });
    };

    const handleExportCsv = () => {
        debugger;
        if (!dataset) return;
        debugger;

        let csvContent = "data:text/csv;charset=utf-8,X,Y\n";

        dataset.points.forEach(p => {
            csvContent += `${p.x.toFixed(2)},${p.y.toFixed(2)}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modified_dataset.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <Box className={"App-group-box"}>
            <Box display={"flex"} flexDirection={"column"} alignItems={"flex-start"} gap={" 8px"} flexShrink={"0"} alignSelf={"stretch"}>
                <Box flexDirection={"row"} display={"flex"} alignSelf={"stretch"} justifyContent={"space-between"}>
                    <Box className="App-title-icon-box">
                        <Image src={"/icons/data.svg"}/>
                        <Heading className="App-text-md">Data</Heading>
                        {isLoading && <Spinner size="sm" ml={2} />}
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
                                            How to prepare a dataset for analysis:<br/>
                                            • it must be in CSV format,<br/>
                                            • it must contain only numerical values,<br/>
                                            • it must be standardized or normalized,<br/>
                                            • it cannot contain missing values.
                                        </Popover.Body>
                                    </Popover.Content>
                                </Popover.Positioner>
                            </Portal>
                        </Popover.Root>
                    </Box>
                </Box>
                {error && (
                    <Alert.Root status="error" size="sm" borderRadius="md">
                        <Alert.Indicator />
                        <Box flex="1" fontSize="xs">{error}</Box>
                        <CloseButton size="sm" onClick={() => setError(null)} />
                    </Alert.Root>
                )}

                <Box w="100%">
                    <FileUpload.Root key={fileUploadKey} maxFiles={1} w="100%" onFileAccept={handleFileUpload}>
                        <FileUpload.HiddenInput />
                        <FileUpload.Dropzone w="100%" minH="150px" h="auto" py={4} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                            <Icon color={"blackAlpha.800"} className="App-icon">
                                <Image src={"/icons/upload.svg"}/>
                            </Icon>
                            <FileUpload.DropzoneContent>
                                <Box>Drag & drop CSV file or click to upload</Box>
                            </FileUpload.DropzoneContent>
                        </FileUpload.Dropzone>
                        <FileUpload.List />
                    </FileUpload.Root>
                </Box>
                {(isModified || isAlgorithmRunning) && (
                    <Button className={"App-button"} onClick={handleExportCsv}>
                        <Image src="/icons/export.svg"/> Export new dataset
                    </Button>
                )}
            </Box>

            <Box flexDirection="column" className="App-title-icon-box">
                <Heading className="App-text-sm-medium">Example data</Heading>
                <NativeSelect.Root size="sm" alignSelf={"stretch"} disabled={isLoading}>
                    <NativeSelect.Field placeholder="Select data" onChange={handleExampleDataSelect} value={selectedExample}>
                        <option value="grid">Grid</option>
                        <option value="grupped">Grupped</option>
                        <option value="scattered">Scattered</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
                {selectedExampleInfo && (
                    <Box className={"App-info-box"} alignSelf={"stretch"}>
                        <Text className={"App-text-sm-normal"}>{selectedExampleInfo.name}</Text>
                        <Text className={"App-text-xs"}>{selectedExampleInfo.description}</Text>
                    </Box>
                )}
            </Box>

            <Box direction="row" display="flex" justifyContent="space-between" alignSelf="stretch" gap="8px">
                <Box flexDirection="column" flex={"1"} className="App-title-icon-box">
                    <Text className={"App-text-sm-medium"} alignSelf="stretch">X-Axis</Text>
                    <NativeSelect.Root size="sm" alignSelf={"stretch"} disabled={isLoading || dataSetMode === 'Example' || availableAxes.length === 0}>
                        <NativeSelect.Field
                            value={selectedX}
                            onChange={(e) => handleAxisChange('X', parseInt(e.target.value))}>
                            {availableAxes.map((axisName, index) => (
                                <option key={index} value={index}>{axisName}</option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Box>
                <Box flexDirection="column" flex={"1"} className="App-title-icon-box">
                    <Text className={"App-text-sm-medium"} alignSelf="stretch">Y-Axis</Text>
                    <NativeSelect.Root size="sm" alignSelf={"stretch"} disabled={isLoading || dataSetMode === 'Example' || availableAxes.length === 0}>
                        <NativeSelect.Field
                            value={selectedY}
                            onChange={(e) => handleAxisChange('Y', parseInt(e.target.value))}>
                            {availableAxes.map((axisName, index) => (
                                <option key={index} value={index}>{axisName}</option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                </Box>
            </Box>

            <Button className={"App-button"} variant={"outline"} onClick={handleReset}><Image src={"/icons/reset.svg"}/>Reset</Button>
        </Box>
    );
}
