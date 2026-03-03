using KMeansProject.Models;

namespace KMeansProject.DTO;

public class AlgorithmInitRequestDto
{ 
    public DataSetDto DataSet { get; set; }
    public CentroidManagerDto CentroidManager { get; set; }
    public int MaxIterations { get; set; }
    public string MetricName { get; set; }
}