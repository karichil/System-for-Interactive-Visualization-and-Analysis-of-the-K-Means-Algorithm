namespace KMeansProject.DTO;

public class BestResultDto
{
    public MetricResultDto Elbow { get; set; }
    public MetricResultDto Silhouette { get; set; }
    public MetricResultDto CalinskiHarabasz { get; set; }
}