namespace KMeansProject.DTO;

public class ClusteringRequestDto
{
    public DataSetDto DataSet { get; set; }
    public int K { get; set; }
}