namespace KMeansProject.DTO;

public class MetricResultDto
{
    public List<ChartPointDto> Points { get; set; } = new();
    public int BestK { get; set; }
}
