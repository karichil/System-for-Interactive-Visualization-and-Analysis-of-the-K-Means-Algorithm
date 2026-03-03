namespace KMeansProject.Models;

public class ManhattanMetric : IDistanceMetric
{
    public string Name { get;} =  "ManhattanMetric";
    double IDistanceMetric.CalculateDistance(DataPoint p1, DataPoint p2)
    {
        double deltaX = Math.Abs(p1.X - p2.X);
        double deltaY = Math.Abs(p1.Y - p2.Y);
        return deltaX + deltaY;
    }
}