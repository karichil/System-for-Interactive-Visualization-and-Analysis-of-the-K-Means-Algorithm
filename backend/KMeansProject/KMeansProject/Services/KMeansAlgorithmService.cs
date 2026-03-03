using AutoMapper;
using KMeansProject.Models;
using KMeansProject.DTO;
using KMeansProject.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace KMeansProject.Services;

public interface IKMeansAlgorithmService
{
    void AlgorithmInitialization(DataSet dataSet, CentroidManager centroidManager, IDistanceMetric metric, int maxIterations);
    bool IsAlgorithmFinished();
    List<DataPoint> FinishResult(int maxIterations);
    List<DataPoint> StepForward();  
    List<DataPoint> StepBackward(); 
    List<DataPoint> GetCurrentCentroids();
    void InTime(int maxIterations, double speed);
    //double SetIntervalSpeed(double interval, double speed);
    int GetIteration();
    void Pause();
    void Stop();
    void Play();
    void ClearToStartAgain();
    List<DataPoint> GetCurrentDataPoints();
}
public class KMeansAlgorithmService : IKMeansAlgorithmService
{    
    private DataSet _dataSet;
    private CentroidManager _centroidManager;
    private IDistanceMetric _metric;
    private readonly Random _rnd = new Random();
    private KMeansAlgorithm.AlgorithmState _state;
    private int _maxIterations;

    private readonly List<KMeansMemento> _history = new();
    private int _historyId = -1;
    private int _maxHistory;
    private int _iteration = 1;
    
    private readonly IMapper _mapper;
    private readonly IHubContext<KMeansHub> _hubContext;
    private CancellationTokenSource _cancellationTokenSource;

    public KMeansAlgorithmService(IMapper mapper, IHubContext<KMeansHub> hubContext)
    {
        _mapper = mapper;
        _hubContext = hubContext;
    }

    public void AlgorithmInitialization(DataSet dataSet, CentroidManager centroidManager,IDistanceMetric metric, int maxIterations)
    {
        _dataSet = dataSet;
        _centroidManager = centroidManager;
        _maxIterations = maxIterations;
        _maxHistory = Math.Max(1, maxIterations);
        _metric = metric;
        _state  = KMeansAlgorithm.AlgorithmState.Initialized;
        _cancellationTokenSource?.Cancel();
        _history.Clear();
        _iteration = 0;
        _historyId = -1;

        SaveSnapshot();
    }
    
    private void AssignPointsToClusters()
    {
        foreach (var p in _dataSet.Points)
        {
            double minDistance = double.MaxValue;
            int bestCluster = -1;

            for (int i = 0; i < _centroidManager.Centroids.Count; i++)
            {
                double dist = _metric.CalculateDistance(p, _centroidManager.Centroids[i]);
                if (dist < minDistance)
                {
                    minDistance = dist;
                    bestCluster = i;
                }
            }

            p.ClusterId = bestCluster;
        }
    }
    private void UpdateCentroids()
    {
        for (int clusterId = 0; clusterId < _centroidManager.Centroids.Count; clusterId++)
        {
            var clusterPoints = _dataSet.Points.Where(p => p.ClusterId == clusterId).ToList();

            if (clusterPoints.Count == 0)
            {
                _centroidManager.Centroids[clusterId] = _dataSet.Points[_rnd.Next(_dataSet.Points.Count)];
            }
            else
            {
                double avgX = clusterPoints.Average(p => p.X);
                double avgY = clusterPoints.Average(p => p.Y);
                _centroidManager.Centroids[clusterId] = new DataPoint(avgX, avgY, clusterId);
            }
        }
    }
    private void Clustering()
    {
        AssignPointsToClusters();
        UpdateCentroids();
        _iteration++;
    }
    public List<DataPoint> FinishResult(int maxIterations)
    {
        _state = KMeansAlgorithm.AlgorithmState.Running;
        for (int i = 0; i < maxIterations; i++)
        {
            var previousCentroids = GetCurrentCentroids();
            Clustering();

            if (HasConverged(previousCentroids) && i!=1)
            {
                Console.WriteLine($"Konwergencja osiągnięta w iteracji {_iteration}. Zatrzymuję.");
                break;
            }
        }
        _state = KMeansAlgorithm.AlgorithmState.Finished;
        //return _centroidManager.Centroids;
        return GetCurrentCentroids();
    }
    
    public bool IsAlgorithmFinished()
    {
        return _state == KMeansAlgorithm.AlgorithmState.Finished;
    }
    
    private bool HasConverged(List<DataPoint> previousCentroids, double epsilon = 0.0001)
    {
        if (previousCentroids.Count != _centroidManager.Centroids.Count) return false;

        for (int i = 0; i < previousCentroids.Count; i++)
        {
            double dist = _metric.CalculateDistance(previousCentroids[i], _centroidManager.Centroids[i]);
            if (dist > epsilon) return false; 
        }
        return true; 
    }

    private  void SaveSnapshot()
    {
        var centroidsCopy = _centroidManager.Centroids
            .Select(c=>new DataPoint(c.X, c.Y, c.ClusterId))
            .ToList();
        
        var clusterIds = _dataSet.Points.Select(p => p.ClusterId).ToList();
        
        var memento = new KMeansMemento(centroidsCopy, clusterIds, _iteration);

        if (_historyId < _history.Count - 1)
        {
            _history.RemoveRange(_historyId + 1, _history.Count - (_historyId + 1));
        }
        
        _history.Add(memento);
        _historyId = _history.Count - 1;
        
        if (_history.Count > _maxHistory)
        {
            _history.RemoveAt(0);
            _historyId = Math.Max(0, _historyId - 1);
        }
    }

    private void ApplySnapshot(KMeansMemento memento)
    {
        _centroidManager.Centroids = memento.Centroids.Select(c => new DataPoint(c.X, c.Y, c.ClusterId)).ToList();
        for (int i = 0; i < _dataSet.Points.Count; i++)
        {
            _dataSet.Points[i].ClusterId = memento.PointClusterId[i];
        }

        _iteration = memento.Iteration;
    }
    
    public List<DataPoint> StepForward()
    {
        if (_historyId < _history.Count - 1)
        {
            _historyId++;
            ApplySnapshot(_history[_historyId]);
            return GetCurrentCentroids();
        }

        var previousCentroids = GetCurrentCentroids(); 
        
        Clustering();
        SaveSnapshot();

        if (_iteration > 1 && HasConverged(previousCentroids))
        {
            _state = KMeansAlgorithm.AlgorithmState.Finished;
            Console.WriteLine($"Konwergencja osiągnięta w iteracji {_iteration}. Zatrzymuję.");
        }

        return GetCurrentCentroids();
    }

    public List<DataPoint> StepBackward()
    {
        if (_historyId > 0)
        {
            _historyId--;
            ApplySnapshot(_history[_historyId]);
        }
        return GetCurrentCentroids();
    }
    
    public List<DataPoint> GetCurrentCentroids()
    {
        return _centroidManager.Centroids
            .Select(c => new DataPoint(c.X, c.Y, c.ClusterId))
            .ToList();
    }
    
   public void InTime(int maxIterations, double speed)
{
    if (_cancellationTokenSource != null)
    {
        _cancellationTokenSource.Cancel();
        _cancellationTokenSource.Dispose();
    }
    _cancellationTokenSource = new CancellationTokenSource();
    var token = _cancellationTokenSource.Token;
    
    _state = KMeansAlgorithm.AlgorithmState.Running;
    
    Task.Run(async () =>
    {
        try
        {
            double baseInterval = 1000;
            double intervalMs = (speed > 0.1) ? (baseInterval / speed) : baseInterval;
            
            while (_iteration < maxIterations && !token.IsCancellationRequested)
            {
                while (_state == KMeansAlgorithm.AlgorithmState.Paused && !token.IsCancellationRequested)
                {
                    await Task.Delay(100, token);
                    continue; 
                }
                var previousCentroids = GetCurrentCentroids();
                
                Clustering();

                var currentCentroids = GetCurrentCentroids();
                var currentPoints = GetCurrentDataPoints();
                
                bool converged = false;
                if (_iteration > 1) 
                {
                    converged = HasConverged(previousCentroids);
                }

                var resultDto = new AlgorithmResultDto
                {
                    Centroids = _mapper.Map<List<DataPointDto>>(currentCentroids),
                    Points = _mapper.Map<List<DataPointDto>>(currentPoints),
                    Iteration = _iteration,
                    IsFinished = converged 
                };
                
                await _hubContext.Clients.All.SendAsync("ReceiveResult", resultDto, token);
                if (converged)
                {
                    await _hubContext.Clients.All.SendAsync("ReceiveFinished", true, token);
                    Stop();
                    break; 
                }
                await Task.Delay((int)intervalMs, token);
            }
            if (_iteration >= maxIterations && !token.IsCancellationRequested)
            {
                await _hubContext.Clients.All.SendAsync("ReceiveFinished", true, token);
                Stop();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[BŁĄD WĄTKU TŁA]: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
        }
        
    }, token);
}

    public int GetIteration()
    {
        return _iteration;
    }

    public void Pause()
    {
        _state = KMeansAlgorithm.AlgorithmState.Paused;
    }

    public void Play()
    {
        _state = KMeansAlgorithm.AlgorithmState.Running;
    }
    
    public void Stop()
    {
        _cancellationTokenSource?.Cancel();
        _state = KMeansAlgorithm.AlgorithmState.Finished;
    }
    
    public void ClearToStartAgain()
    {
        Stop();
        _dataSet.Points.Clear();
        _centroidManager.Centroids.Clear();
        _state = KMeansAlgorithm.AlgorithmState.Cancelled;
        _iteration = 0;
        _historyId = -1;
        _history.Clear();
        SaveSnapshot();
    }
    public List<DataPoint> GetCurrentDataPoints()
    {
        return _dataSet.Points.Select(p => new DataPoint(p.X, p.Y, p.ClusterId)).ToList();
    }
}