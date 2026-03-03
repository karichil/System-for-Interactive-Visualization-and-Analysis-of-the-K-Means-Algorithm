namespace KMeansProject.Models;

public class KMeansMemento
{
    public List<DataPoint> Centroids { get; set; }
    public List<int> PointClusterId { get; set; }
    public int Iteration { get; set; }
    
    public KMeansMemento(List<DataPoint> centroids, List<int> pointClusterId, int iteration)
        {
        Centroids = centroids;
        PointClusterId = pointClusterId;
        Iteration = iteration;
        }
}