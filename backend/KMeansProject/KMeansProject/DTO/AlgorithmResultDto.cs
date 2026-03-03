namespace KMeansProject.DTO;

public class AlgorithmResultDto
{
    public List<DataPointDto> Centroids { get; set; }
    public List<DataPointDto> Points { get; set; }
    public int Iteration { get; set; }
    public bool IsFinished { get; set; }
}