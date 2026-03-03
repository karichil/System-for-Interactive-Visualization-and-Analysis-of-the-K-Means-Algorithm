namespace KMeansProject.Models;

public class KMeansAlgorithm
{
    private readonly DataSet _dataSet;
    private readonly CentroidManager _centroidManager;

    private readonly IDistanceMetric _metric;
    public enum AlgorithmState
    {
        Initialized,
        Running,
        Paused,
        Finished,
        Cancelled
    }
}