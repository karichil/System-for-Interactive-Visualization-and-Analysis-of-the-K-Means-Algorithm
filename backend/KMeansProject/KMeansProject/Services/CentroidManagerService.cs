using AutoMapper;
using KMeansProject.DTO;
using KMeansProject.Models;

namespace KMeansProject.Services;

public interface ICentroidManagerService
{
    void Initialization(CentroidManager.CentroidMode mode, int k, DataSet points);
    List<DataPoint> ManualInit(List<DataPoint> userCentroid);
    List<DataPoint> KMeansPlusPlusInit(List<DataPoint> points, int k);
    void AddCentroid(double x, double y);
    DataPoint UpdateCentroid(DataPointDto centroid, double newX, double newY);
    void RemoveCentroid(int id);
    List<DataPoint> RandomInit(List<DataPoint> points, int k);
    int SetClusterId();
    List<DataPoint> GetCentroids();
    void ResetControidsParameters();
}

public class CentroidManagerService :ICentroidManagerService
{
    private List<DataPoint> _centroids = new();
    private readonly IMapper _mapper;

    public CentroidManagerService(IMapper mapper)
    {
        _mapper = mapper;
    }

    
    public void Initialization(CentroidManager.CentroidMode mode, int k, DataSet points)
    {
        ResetControidsParameters();
        
        switch (mode)
        {
            case CentroidManager.CentroidMode.Manual: _centroids = ManualInit(points.Points);
                break;
            case CentroidManager.CentroidMode.Random: _centroids = RandomInit(points.Points, k);
                break;
            case CentroidManager.CentroidMode.KMeansPlusPlus:
                if (points == null)
                    throw new ArgumentException("Manual initialization requires coordinates");
                _centroids = KMeansPlusPlusInit(points.Points, k);
                break;
            default: KMeansPlusPlusInit(points.Points, k);
                break;
        }
    }

    public List<DataPoint> ManualInit(List<DataPoint> userCentroid)
    {
        List<DataPoint> centroids = new();
        foreach (var point in userCentroid)
        {
            centroids.Add(new DataPoint(point.X, point.Y, centroids.Count));
        }
        return centroids;
    }
    
    public List<DataPoint> KMeansPlusPlusInit(List<DataPoint> points, int k)
    {
        var centroids = new List<DataPoint>();
        var rand = new Random();
        IDistanceMetric distanceMetric = new EuclideanMetric();
        
        var firstPoint = points[rand.Next(points.Count)];
        centroids.Add(new DataPoint(firstPoint.X, firstPoint.Y,0));

        while (centroids.Count < k)
        {
            var distances = points.Select(p =>
            {
                var minDist = centroids.Min(c =>
                    distanceMetric.CalculateDistance(p, new DataPoint (c.X, c.Y)));
                return minDist * minDist;
            }).ToList();

            var total = distances.Sum();
            var r = rand.NextDouble() * total;
            double cumulative = 0;

            for (int i = 0; i < points.Count; i++)
            {
                cumulative += distances[i];
                if (r <= cumulative)
                {
                    centroids.Add(new DataPoint(points[i].X, points[i].Y, centroids.Count));
                    break;
                }
            }
        }
        return centroids;
    }
    
    public DataPoint GetCentroid(int centroidId)
    {
        if (centroidId < 0 || centroidId >= _centroids.Count)
            throw new ArgumentOutOfRangeException(nameof(centroidId));
        return _centroids[centroidId];
    }

    public void AddCentroid(double x, double y)
    {
        _centroids.Add(new DataPoint(x,y,_centroids.Count));
    }

    public DataPoint UpdateCentroid(DataPointDto centroid, double newX, double newY)
    {
        var upadtedCentroid = GetCentroid(centroid.ClusterId);
        upadtedCentroid.X = newX;
        upadtedCentroid.Y = newY;
        return _mapper.Map<DataPoint>(upadtedCentroid);
    }
    
    public void RemoveCentroid(int centroidId)
    {
        _centroids.Remove(GetCentroid(centroidId));
    }

    public List<DataPoint> RandomInit(List<DataPoint> points, int k)
    {
        var random = new Random();
        ResetControidsParameters();
        for (int i = 0; i < k; i++)
        {
            var point = points[random.Next(points.Count)];
            AddCentroid(point.X, point.Y);
        }
        return _centroids;
    }

    public void ResetControidsParameters()
    {
        _centroids.Clear();
    }

    public int SetClusterId()
    {
        return _centroids.Count;
    }
    
    public List<DataPoint> GetCentroids()
    {
        return _centroids;
    }

}