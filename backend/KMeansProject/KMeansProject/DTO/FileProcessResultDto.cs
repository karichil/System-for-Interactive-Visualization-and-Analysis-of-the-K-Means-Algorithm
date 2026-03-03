namespace KMeansProject.DTO;

public class FileProcessResultDto
{
    public List<string> Headers { get; set; }
    public List<List<double>> ProcessedData { get; set; }
}