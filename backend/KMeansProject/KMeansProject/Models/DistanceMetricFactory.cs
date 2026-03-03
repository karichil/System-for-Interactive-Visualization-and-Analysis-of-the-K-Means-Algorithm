namespace KMeansProject.Models;

public static class DistanceMetricFactory
{
    public static IDistanceMetric GetMetric(string name) =>
        name.ToLower() switch
        {
            "euclidean" => new EuclideanMetric(),
            "manhattan" => new ManhattanMetric(),
            _ => throw new ArgumentException("Unknown metric")
        };
}