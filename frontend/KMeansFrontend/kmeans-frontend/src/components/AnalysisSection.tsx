import { Box, Button, Image, Separator, Text, Spinner, HStack } from "@chakra-ui/react";
import React, { useState, useRef } from "react";
import axios from 'axios';
import { IAlgorithmResults, AnalysisMethod, IBestResults, IDataSetDto, IMetricResult } from "../types/interfaces";
import { toaster } from "./ui/toaster";
import {ResponsiveContainer, ComposedChart, XAxis, YAxis, Line, Scatter, Tooltip, CartesianGrid, ReferenceLine, Label, Legend} from "recharts";

const API_BASE_URL = "http://localhost:5075/api/ClusteringResults";

interface AnalysisSectionProps {
    dataSet: IDataSetDto | null;
    kValue: number;
    isModified: boolean;
}

const methodConfigs: Record<AnalysisMethod, { title: string, description: string}> = {
    elbow: {
        title: "Elbow Method",
        description: "Helps determine the optimal number of clusters (K). It plots the Sum of Squared Errors (SSE) against the number of clusters (K)."
    },
    silhouette: {
        title: "Silhouette Score",
        description: "Measures how similar an object is to its own cluster compared to other clusters (range -1 to +1)."
    },
    calinskiHarabasz: {
        title: "Calinski-Harabasz Index",
        description: "Measures the ratio of between-cluster dispersion to within-cluster dispersion. Higher is better."
    }
};

export default function AnalysisSection({ dataSet, kValue, isModified}: AnalysisSectionProps) {
    const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
    const [activeMethod, setActiveMethod] = useState<AnalysisMethod>('elbow');
    const [isLoading, setIsLoading] = useState(false);
    const [benchmarkData, setBenchmarkData] = useState<IBestResults | null>(null);
    const [userResult, setUserResult] = useState<IAlgorithmResults | null>(null);

    const contentRef = useRef<HTMLDivElement>(null);
    const reportRef = useRef<HTMLDivElement>(null);
    const currentConfig = methodConfigs[activeMethod];

    const fetchResults = async () => {
        if (!dataSet || !dataSet.points || !Array.isArray(dataSet.points)) {
            toaster.warning({ title: "No dataset", description: "Please load a dataset first." });
            return;
        }

        setIsLoading(true);

        const dataSetPayload = {
            Points: dataSet.points.map(p => ({
                X: p.x,
                Y: p.y,
                ClusterId: p.clusterId ?? -1
            }))
        };

        try {
            const bestResResponse = await axios.post<IBestResults>(
                `${API_BASE_URL}/best-results`,
                dataSetPayload
            );
            setBenchmarkData(bestResResponse.data);
            const algoResResponse = await axios.post<IAlgorithmResults>(
                `${API_BASE_URL}/algorithm-results`,
                {
                    DataSet: dataSetPayload,
                    K: kValue
                }
            );
            setUserResult(algoResResponse.data);
            setIsAnalysisVisible(true);
            /*if(isModified){
                setIsAnalysisVisible(true);
            }*/

            toaster.success({ title: "Analysis complete" });

        } catch (err: any) {
            console.error("Error fetching analysis results:", err);
            const errorMsg = err.response?.data
                ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data))
                : err.message;

            toaster.error({
                title: "Analysis failed",
                description: errorMsg || "Could not fetch results."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getChartData = (method: AnalysisMethod) => {
        if (!benchmarkData) return { data: [], bestK: 0 };
        const keyPascal = method === 'calinskiHarabasz' ? 'calinskiHarabasz' : method;
        const dataObj = benchmarkData as any;
        const series = dataObj[keyPascal] || [];
        const bestK = series.BestK || series.bestK || 0;
        const seriesArray = series.Points || series.points || [];
        if (!Array.isArray(seriesArray)) return { data: [], bestK: 0 };

        const chartData = seriesArray.map((IMetricResult: any) => {
            const kVal = IMetricResult.K !== undefined ? IMetricResult.K : IMetricResult.k;
            const benchVal = IMetricResult.Value !== undefined ? IMetricResult.Value : IMetricResult.value;
            let userScoreVal = null;

            if (kVal === kValue && userResult) {
                if (method === 'silhouette') {
                    userScoreVal = (userResult.SilhouetteScore ?? (userResult as any).silhouetteScore);
                } else if (method === 'calinskiHarabasz') {
                    userScoreVal = (userResult.CalinskiHarabasz?? (userResult as any).calinskiHarabasz);
                } else if (method === 'elbow') {
                    userScoreVal = benchVal;
                }
            }
            const optimalVal = (kVal === bestK) ? benchVal : null;
            return { k: kVal, benchmark: benchVal, userScore: userScoreVal, optimalPoint: optimalVal };
        });

        return { data: chartData, bestK: bestK };
    };

    const { data: chartData, bestK } = getChartData(activeMethod);
    const kTicks = chartData.map((d: any) => d.k);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const benchmarkItem = payload.find((p: any) => p.dataKey === 'benchmark');
            const userItem = payload.find((p: any) => p.dataKey === 'userScore');
            const bestItem = payload.find((p: any) => p.dataKey === 'optimalPoint');

            return (
                <div style={{ backgroundColor: 'white', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <p>k= {label}</p>
                    <p style={{ color: '#8884d8' }}>Score: {benchmarkItem?.value?.toFixed(4)}</p>
                    {bestItem && <p style={{ color: 'darkred', fontWeight: 'bold' }}>★ Best Result (k={kValue})</p>}
                    {userItem && <p style={{ color: '#879800', fontWeight: 'bold' }}>★ Your Result (k={kValue})</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <Box display={"flex"} padding={"16px 16px"} flexDirection={"column"} alignItems={"flex-start"} gap={"16px"} border="1px solid rgba(0,0,0,0.1)"
             borderRadius="8px">
            <Box flexDirection="row" display={"flex"} alignSelf="stretch" justifyContent={"space-between"} alignItems={"center"}>
                <Box className="App-title-icon-box">
                    <Image src={"/icons/analysis.svg"}/>
                    <Text className="App-text-md-bigger">Clustering Quality Analysis</Text>
                </Box>
                <Button
                    type="button"
                    className="App-button"
                    size="sm"
                    onClick={fetchResults}
                    disabled={isLoading || !dataSet}
                >
                    {isLoading ? <Spinner size="sm"/> : <Image src={"/icons/startOutline.svg"}/>}
                    {isLoading ? " Running..." : " Run analysis"}
                </Button>
            </Box>
            {isAnalysisVisible && (
                <Box display="flex" flexDirection="column" alignItems="flex-start" gap="16px" alignSelf="stretch"
                     ref={contentRef}>
                    <Box display={"flex"} alignItems={"center"} gap={"24px"}>
                        <Text className={"App-text-md"}>Best results for dataset</Text>
                        <Box display={"flex"} alignItems={"center"} gap={"4px"}>
                            {(Object.keys(methodConfigs) as AnalysisMethod[]).map(method => (
                                <Button
                                    key={method}
                                    size={"sm"}
                                    onClick={() => setActiveMethod(method)}
                                    variant={activeMethod === method ? "solid" : "outline"}
                                    colorScheme={activeMethod === method ? "blue" : "gray"}
                                >
                                    {methodConfigs[method].title.replace(' Method', '').replace(' Index', '').replace(' Score', '')}
                                </Button>
                            ))}
                        </Box>
                    </Box>

                    <Box height="300px" width="100%">
                        <ResponsiveContainer width={"100%"} height={"100%"}>
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="k"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    tickCount={21}
                                    ticks={kTicks}
                                    interval={0}
                                    allowDecimals={false}
                                    label={{ value: 'k (clusters)', position: 'insideBottomRight', offset: -5 }}/>
                                <YAxis label={{ value: 'Score', angle: -90, position: 'insideLeft' }}/>
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2 }} />
                                <Legend verticalAlign="top" height={36}/>
                                <Line
                                    type="monotone"
                                    dataKey="benchmark"
                                    stroke="#8884d8"
                                    dot={{ r: 3 }}
                                    name="Score"
                                    activeDot={{ r: 5 }}
                                />

                                {bestK > 0 && (
                                    <ReferenceLine x={bestK} stroke="darkred" strokeDasharray="3 3" />
                                )}

                                <Scatter
                                    name="Best Result"
                                    dataKey="optimalPoint"
                                    fill="darkred"
                                    shape="circle"
                                    r={60}
                                />

                                {userResult && (
                                    <ReferenceLine x={kValue} stroke="#879800" strokeDasharray="3 3"/>
                                )}

                                <Scatter
                                    name="Your Result"
                                    dataKey="userScore"
                                    fill="#879800"
                                    shape="circle"
                                    r={200}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Box>

                    <Box className={"App-info-box"} width={"100%"}>
                        <Text className={"App-text-sm-normal"}>{currentConfig.title}</Text>
                        <Text className={"App-text-xs"}>{currentConfig.description}</Text>
                    </Box>
                </Box>
            )}
        </Box>
    );
}