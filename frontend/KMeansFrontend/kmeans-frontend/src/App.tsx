import React, { useState } from 'react';
import {Box, Flex, Separator} from '@chakra-ui/react';
import { Toaster } from "./components/ui/toaster"
import "./App.css";
import Header from "./components/Header";
import ControlPanel from "./components/ControlPanel/ControlPanel";
import ChartSection from "./components/ChartSection";
import AnalysisSection from "./components/AnalysisSection";
import {  IDataSetDto, ICentroidManagerDto, CentroidInitMode, EditMode } from "./types/interfaces";


export default function App() {
  const [baseDataSet, setBaseDataSet] = useState<IDataSetDto | null>(null);
  const [kValue, setKValue] = useState<number>(0);
  const [initMode, setInitMode] = useState<CentroidInitMode>("KMeansPlusPlus");
  const [metricName, setMetricName] = useState<string>("Euclidean");
  const [maxIterations, setMaxIterations] = useState<number>(100);
  const [initialCentroids, setInitialCentroids] = useState<ICentroidManagerDto | null>(null);
  const [finalDataSet, setFinalDataSet] = useState<IDataSetDto | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isModified, setIsModified] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<EditMode>(null);

  return (
      <Flex direction="column" height="100vh" className="App">
        <Header />

        <Separator
            orientation="horizontal"
            width="100%"
            borderColor="rgba(0, 0, 0, 0.2)"/>

        {/*Left side bar and main*/}
        <Flex overflow="hidden">
          <Box w="25%" overflowY="auto" borderRight="1px solid rgba(0,0,0,0.1)">
            <ControlPanel setBaseDataSet={setBaseDataSet}
                          dataset={baseDataSet}
                          kValue={kValue}
                          metricName={metricName}
                          maxIterations={maxIterations}
                          initialCentroids={initialCentroids}
                          setKValue={setKValue}
                          setMetricName={setMetricName}
                          setMaxIterations={setMaxIterations}
                          setInitMode={setInitMode}
                          setInitialCentroids={setInitialCentroids}
                          setFinalDataSet={setFinalDataSet}
                          finalDataSet={finalDataSet ? finalDataSet.points : []}
                          setIsInitialized={setIsInitialized}
                          isInitialized={isInitialized}
                          isModified={isModified}
                          setIsModified={setIsModified}
                          setEditMode={setEditMode}
                          editMode={editMode}/>
          </Box>
          {/*Chart and analysis*/}
            <Flex direction="column" w="75%"  overflow="hidden">
                <Box overflowY="auto" p={4} display="flex" flexDirection="column" gap="8px" h="100%">
                    <Box w="100%" h="90%" flexShrink={0}>
                        <ChartSection data={baseDataSet ? baseDataSet.points : []}
                                      setBaseDataSet={setBaseDataSet}
                                      initMode={initMode}
                                      initialCentroids={initialCentroids}
                                      setInitialCentroids={setInitialCentroids}
                                      kValue={kValue}
                                      finalDataSet={finalDataSet ? finalDataSet.points : []}
                                      isModified={isModified}
                                      setIsModified={setIsModified}
                                      editMode={editMode}
                                      setIsInitialized={setIsInitialized}/>
                    </Box>
                    <Box flexShrink={0}>
                        <AnalysisSection dataSet={finalDataSet} kValue={kValue} isModified={isModified}/>
                    </Box>
                </Box>
            </Flex>
        </Flex>
          <Toaster />
      </Flex>
  );
}
