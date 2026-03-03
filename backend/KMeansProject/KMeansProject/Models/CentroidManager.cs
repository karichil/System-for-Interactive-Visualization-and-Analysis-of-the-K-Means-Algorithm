namespace KMeansProject.Models;

public class CentroidManager
{
    public List<DataPoint> Centroids { get; set; } = new();

    public enum CentroidMode
    {
        Manual,
        KMeansPlusPlus,
        Random
    }
}