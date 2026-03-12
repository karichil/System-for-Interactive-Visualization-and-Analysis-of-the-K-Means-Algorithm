namespace KMeansProject.Models;

public class EuclideanMetric : IDistanceMetric
{
    public string Name { get;} =  "EuclideanMetric";
    
    // pozwoliłem sobie zrobić public aby mieć co testować xD
    public double CalculateDistance(DataPoint p1, DataPoint p2)
    {
        double deltaX = p1.X - p2.X;
        double deltaY = p1.Y - p2.Y;
        return Math.Sqrt(deltaX * deltaX + deltaY * deltaY);
    }
    
}