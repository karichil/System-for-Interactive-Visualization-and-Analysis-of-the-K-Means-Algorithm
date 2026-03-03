using AutoMapper;
using KMeansProject.DTO;
using KMeansProject.Models;
using KMeansProject.Services;
using Microsoft.AspNetCore.Mvc;

namespace KMeansProject.Controllers;

public class MetricFactory
{
    public IDistanceMetric GetMetric(string metricName)
    {
        if (metricName.Equals("Euclidean", StringComparison.OrdinalIgnoreCase))
        {
            return new EuclideanMetric();
        }
        if (metricName.Equals("Manhattan", StringComparison.OrdinalIgnoreCase))
        {
            return new ManhattanMetric();
        }
        throw new ArgumentException($"Nieznana metryka: {metricName}");
    }
}

[ApiController]
[Route("api/[controller]")]
public class KMeansAlgoritmController : ControllerBase 
{
    private readonly IKMeansAlgorithmService _kmeansAlgorithmService;
    private readonly IMapper _mapper;
    private readonly MetricFactory  _metricFactory;

    public KMeansAlgoritmController(IMapper mapper, IKMeansAlgorithmService kmeansAlgorithmService, MetricFactory  metricFactory)
    {
        _kmeansAlgorithmService = kmeansAlgorithmService;
        _mapper = mapper;
        _metricFactory = metricFactory;
    }

    [HttpPost("initialize")]
    [ProducesResponseType(typeof(List<DataPointDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult AlgorithmInitialization([FromBody] AlgorithmInitRequestDto request)
    {
        try
        {
            var dataSet = _mapper.Map<DataSet>(request.DataSet);
            var centroidManager = _mapper.Map<CentroidManager>(request.CentroidManager);
            var selectedMetric = _metricFactory.GetMetric(request.MetricName);
            
            _kmeansAlgorithmService.AlgorithmInitialization(dataSet, centroidManager, selectedMetric ,request.MaxIterations);
            
            var initialCentroids = _kmeansAlgorithmService.GetCurrentCentroids();
            var initialCentroidsDto = _mapper.Map<List<DataPointDto>>(initialCentroids);
            
            return Ok(initialCentroidsDto);
        }
        catch (ArgumentException ex) 
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwisu: {ex.Message}");
        }
    }
    
    [HttpPost("finish-result")]
    [ProducesResponseType(typeof(List<DataPointDto>), StatusCodes.Status200OK)]
    public IActionResult FinishResult([FromBody] AlgorithmInitRequestDto request)
    {
        try
        {
            var finalCentroids = _kmeansAlgorithmService.FinishResult(request.MaxIterations);
            var updatedPoints = _kmeansAlgorithmService.GetCurrentDataPoints();
            var resultDto = new AlgorithmResultDto
            {
                Centroids = _mapper.Map<List<DataPointDto>>(finalCentroids),
                Points = _mapper.Map<List<DataPointDto>>(updatedPoints),
                Iteration = _kmeansAlgorithmService.GetIteration(),
                IsFinished = _kmeansAlgorithmService.IsAlgorithmFinished()
            };
            return Ok(resultDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwisu: {ex.Message}");
        }
    }
    
    
    [HttpPost("step-forward")]
    [ProducesResponseType(typeof(List<DataPointDto>), StatusCodes.Status200OK)]
    public IActionResult StepForward()
    {
        try
        {
            var newCentroids = _kmeansAlgorithmService.StepForward();
            var newCentroidsDto = _mapper.Map<List<DataPointDto>>(newCentroids);
            var updatedPoints = _kmeansAlgorithmService.GetCurrentDataPoints();
            var updatedPointsDto = _mapper.Map<List<DataPointDto>>(updatedPoints);
            var resultDto = new AlgorithmResultDto
            {
                Centroids = _mapper.Map<List<DataPointDto>>(newCentroidsDto),
                Points = _mapper.Map<List<DataPointDto>>(updatedPointsDto),
                Iteration = _kmeansAlgorithmService.GetIteration(),
                IsFinished = _kmeansAlgorithmService.IsAlgorithmFinished()
            };
            return Ok(resultDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwisu: {ex.Message}");
        }
    }
    
    [HttpPost("step-backward")]
    [ProducesResponseType(typeof(List<DataPointDto>), StatusCodes.Status200OK)]
    public IActionResult StepBackward()
    {
        try
        {
            var oldCentroids = _kmeansAlgorithmService.StepBackward();
            var oldCentroidsDto = _mapper.Map<List<DataPointDto>>(oldCentroids);
            var oldPoints = _kmeansAlgorithmService.GetCurrentDataPoints();
            var oldPointsDto = _mapper.Map<List<DataPointDto>>(oldPoints);
            
            var resultDto = new AlgorithmResultDto
            {
                Centroids = _mapper.Map<List<DataPointDto>>(oldCentroidsDto),
                Points = _mapper.Map<List<DataPointDto>>(oldPointsDto),
                Iteration = _kmeansAlgorithmService.GetIteration()
            };
            return Ok(resultDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwisu: {ex.Message}");
        }
    }

    [HttpGet("status")]
    [ProducesResponseType(typeof(List<DataPointDto>), StatusCodes.Status200OK)]
    public IActionResult GetCurrentCentroids()
    {
        try
        {
            var currentCentroids = _kmeansAlgorithmService.GetCurrentCentroids();
            var currentCentroidsDto = _mapper.Map<List<DataPointDto>>(currentCentroids);
            return Ok(currentCentroidsDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwisu: {ex.Message}");
        }
    }
    
    [HttpPost("run-intime")]
    public IActionResult InTime([FromQuery] int maxIterations, [FromQuery] double speed)
    {
        if (maxIterations <= 0)
            return BadRequest("Wymagana jest MaxIterations > 0.");
        try
        {
            _kmeansAlgorithmService.InTime(maxIterations, speed);
            return Ok(); 
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd: {ex.Message}");
        }
    }
    
    [HttpPost("pause")]
    public IActionResult Pause()
    {
        _kmeansAlgorithmService.Pause();
        return Ok();
    }
    
    [HttpPost("play")]
    public IActionResult Play()
    {
        _kmeansAlgorithmService.Play();
        return Ok();
    }
    
    [HttpPost("stop")] 
    public IActionResult Stop()
    {
        _kmeansAlgorithmService.Stop();
        return Ok();
    }

    [HttpPost("clear")]
    public IActionResult ClearToStartAgain()
    {
        _kmeansAlgorithmService.ClearToStartAgain();
        return Ok();
    }
    
}