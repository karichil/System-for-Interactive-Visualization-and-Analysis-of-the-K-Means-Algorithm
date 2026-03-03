namespace KMeansProject.Models;

public class DataPoint
{	
	public double X { get; set; }
	public double Y { get; set; }
	public int ClusterId { get; set; }

	public DataPoint(double x, double y)
	{
		X = x;
		Y = y;
		ClusterId = -1;
	}
	
	public DataPoint(double x, double y, int clusetrId)
	{
		X = x;
		Y = y;
		ClusterId = clusetrId;
	}
}