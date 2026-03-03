using AutoMapper;
using KMeansProject.DTO;
using KMeansProject.Models;

namespace KMeansProject.Services;

public interface IDataSetService
{
    DataSet CreateDataSet(DataSetRequestDto datasetRequestDto);
    DataSet UpdateDataSetAxes(DataSetRequestDto datasetRequestDto);
    void AddPoint(DataPointDto p);
    void RemovePoint(int pointId);
    DataPoint GetPoint(int pointId);
    void UpdatePoint(int pointId, double newX, double newY);
    IEnumerable<DataPoint> GetPoints();
    void ResetData();
}

public class DataSetService : IDataSetService
{
    private readonly  IMapper _mapper;
    private DataSet _dataSet =  new DataSet();
    private ICentroidManagerService _centroidManager;

    public DataSetService(IMapper mapper, ICentroidManagerService centroidManager)
    {
        _mapper = mapper;
        _centroidManager = centroidManager;
    }
    
    public DataSet CreateDataSet(DataSetRequestDto datasetRequestDto)
    {
        _dataSet.Points.Clear();

        for (int i = 0; i < datasetRequestDto.Data.Count; i++)
        {
            double x = datasetRequestDto.Data[i][datasetRequestDto.X];
            double y = datasetRequestDto.Data[i][datasetRequestDto.Y];

            _dataSet.Points.Add(new DataPoint(x, y));
        }

        return _dataSet;
    }
    
    public DataSet UpdateDataSetAxes(DataSetRequestDto datasetRequestDto)
    {
        return CreateDataSet(datasetRequestDto);
    }
    
    public void AddPoint(DataPointDto dataPointDto)
    {
        var point = _mapper.Map<DataPoint>(dataPointDto);
        _dataSet.Points.Add(point);
    }

    public void UpdatePoint(int pointId, double newX, double newY)
    {
        if (pointId < 0 || pointId >= _dataSet.Points.Count)
        {
            throw new ArgumentOutOfRangeException(nameof(pointId), "Indeks punktu poza zakresem.");
        }
        
        var existingPoint = _dataSet.Points[pointId]; 
        existingPoint.X = newX;
        existingPoint.Y = newY;
        existingPoint.ClusterId = -1;
    }

    public void RemovePoint(int pointId )
    {
        if (pointId >= 0 && pointId < _dataSet.Points.Count)
        {
            _dataSet.Points.RemoveAt(pointId);
        }
    }
	
    public DataPoint GetPoint(int pointId)
    {
        if (pointId < 0 || pointId >= _dataSet.Points.Count)
            throw new ArgumentOutOfRangeException(nameof(pointId));
        return _mapper.Map<DataPoint>(_dataSet.Points[pointId]);
    }

    public IEnumerable<DataPoint> GetPoints()
    {
        return _mapper.Map<IEnumerable<DataPoint>>(_dataSet.Points);
    }

    public void ResetData()
    {
        _dataSet.Points.Clear();
    }
}