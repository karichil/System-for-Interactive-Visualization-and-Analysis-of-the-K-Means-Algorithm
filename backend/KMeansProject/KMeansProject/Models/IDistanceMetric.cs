namespace KMeansProject.Models;

public interface IDistanceMetric
{
    public string Name { get; }
    double CalculateDistance(DataPoint p1, DataPoint p2);
}