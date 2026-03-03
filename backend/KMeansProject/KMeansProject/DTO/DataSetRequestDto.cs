namespace KMeansProject.DTO;

public class DataSetRequestDto
{
    public List<List<double>> Data { get; set; } = new();
    public int X { get; set; }
    public int Y { get; set; }
}