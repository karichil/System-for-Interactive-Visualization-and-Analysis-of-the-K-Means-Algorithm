import {Box, Image, Separator, Text} from "@chakra-ui/react";
import React from "react";

import DataSetSection from "./DataSetSection";
import KMeansParameters from "./KMeansParameters";
import AlgorithmControl from "./AlgorithmControl";
import ManualEditing from "./ManualEditing";
import AboutSection from "./AboutSection";

import {IDataSetDto, CentroidInitMode, ICentroidManagerDto, EditMode, IDataPointDto} from "../../types/interfaces";

interface ControlPanelProps {
    setBaseDataSet: (data: IDataSetDto | null) => void;
    dataset: IDataSetDto | null;
    kValue: number;
    metricName: string;
    maxIterations: number;
    initialCentroids: ICentroidManagerDto | null;
    setKValue: (k: number) => void;
    setMetricName: (name: string) => void;
    setMaxIterations: (iter: number) => void;
    setInitMode: (mode: CentroidInitMode) => void;
    setInitialCentroids: (centroids: ICentroidManagerDto | null) => void;
    setFinalDataSet: (data: IDataSetDto | null) => void
    finalDataSet: IDataPointDto[];
    setIsInitialized: (isInitialized: boolean) => void;
    isInitialized: boolean;
    setIsModified: (isModified: boolean) => void;
    isModified: boolean;
    setEditMode: (mode: EditMode) => void;
    editMode: EditMode;
}

export default function ControlPanel({ setBaseDataSet, dataset,kValue,setKValue,metricName,maxIterations,initialCentroids,setMetricName, setMaxIterations,setInitMode,
                                         setInitialCentroids, setFinalDataSet,finalDataSet, setIsInitialized, isInitialized, setIsModified, isModified,setEditMode,editMode }: ControlPanelProps) {
    return (
        <Box className={"App-control-bar"}>
            <Box className="App-title-icon-box">
                <Image src={"/icons/settings.svg"}/>
                <Text className="App-text-md-bigger">Control Panel</Text>
            </Box>
            <DataSetSection setBaseDataSet={setBaseDataSet} isModified={isModified} setIsModified={setIsModified} dataset={dataset} finalDataSet={finalDataSet}/>
            <Separator
                orientation="horizontal"
                width="100%"
                borderColor="rgba(0, 0, 0, 0.2)"/>
            <ManualEditing editMode={editMode} setEditMode={setEditMode} dataset={dataset} finalDataSet={finalDataSet}/>
            <Separator
                orientation="horizontal"
                width="100%"
                borderColor="rgba(0, 0, 0, 0.2)"/>
            <KMeansParameters dataset={dataset}
                              kValue={kValue}
                              metricName={metricName}
                              maxIterations={maxIterations}
                              initialCentroids={initialCentroids}
                              setKValue={setKValue}
                              setMetricName={setMetricName}
                              setMaxIterations={setMaxIterations}
                              setInitMode={setInitMode}
                              setInitialCentroids={setInitialCentroids}
                              isInitialized={isInitialized}
                              setIsInitialized={setIsInitialized}
                              setEditMode={setEditMode}
                              setIsModified={setIsModified}
                              setFinalDataSet={setFinalDataSet}/>
            <Separator
                orientation="horizontal"
                width="100%"
                borderColor="rgba(0, 0, 0, 0.2)"/>
            <AlgorithmControl
                dataset={dataset}
                metricName={metricName}
                maxIterations={maxIterations}
                initialCentroids={initialCentroids}
                setInitialCentroids={setInitialCentroids}
                setFinalDataSet={setFinalDataSet}
                isInitialized={isInitialized}
                setIsInitialized={setIsInitialized}
                isModified={isModified}
                setIsModified={setIsModified}
            />
            <Separator
                orientation="horizontal"
                width="100%"
                borderColor="rgba(0, 0, 0, 0.2)"/>
            <AboutSection/>
        </Box>
    );
}


