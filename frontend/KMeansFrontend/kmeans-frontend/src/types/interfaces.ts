export interface IAlgorithmInitRequestDto {
    DataSet: IDataSetDto;
    CentroidManager: ICentroidManagerDto;
    MaxIterations: number;
    MetricName: string;

}

export interface IAlgorithmResultDto {
    centroids: IDataPointDto[];
    points: IDataPointDto[];
    iteration: number;
    isFinished: boolean;
}

export interface IFileProcessResultDto {
    headers: string[];
    processedData: number[][];
}
export type CentroidInitMode = "KMeansPlusPlus" | "Manual";

export interface ICentroidManagerDto {
    centroids: IDataPointDto[];
}

export interface IAlgorithmResults {
    SilhouetteScore: number;
    CalinskiHarabasz: number;
}

export interface IDataPointDto {
    x: number;
    y: number;
    clusterId: number;
}

export interface IDataSetDto {
    points: IDataPointDto[];
}

export interface IDataSetRequestDto {
    data: number[][];
    x: number;
    y: number;
}

export interface IChartPoint {
    k: number;
    value: number; }

export interface IMetricResult {
    BestK: number;
    Points: IChartPoint[];
}

export interface IBestResults {
    Elbow: IMetricResult;
    Silhouette: IMetricResult;
    CalinskiHarabasz: IMetricResult;
}

export type AnalysisMethod = 'elbow' | 'silhouette' | 'calinskiHarabasz';
export type EditMode = 'Points' | 'Centroids' | null;