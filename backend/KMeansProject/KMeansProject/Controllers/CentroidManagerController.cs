using AutoMapper;
using KMeansProject.DTO;
using KMeansProject.Models;
using KMeansProject.Services;
using Microsoft.AspNetCore.Mvc;

namespace KMeansProject.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CentroidManagerController: ControllerBase
{
    private readonly ICentroidManagerService _centroidManagerService;
    private readonly IMapper _mapper;

    public CentroidManagerController(ICentroidManagerService centroidManagerService, IMapper mapper)
    {
        _centroidManagerService = centroidManagerService;
        _mapper = mapper;
    }

    // POST: api/CentroidManager/init?mode={mode}&k={k}
    [HttpPost("init")]
    public IActionResult Initialization([FromQuery] CentroidManager.CentroidMode mode, [FromQuery] int k, [FromBody] DataSetDto pointsDto)
    {
        try
        {
            var points = _mapper.Map<DataSet>(pointsDto);
            if (points == null || !points.Points.Any())
                return BadRequest("Dane do inicjalizacji centroidów są wymagane.");
            
            _centroidManagerService.Initialization(mode, k, points);

            var centroids = _centroidManagerService.GetCentroids();
            return Ok(_mapper.Map<List<DataPointDto>>(centroids));
        }
        catch (ArgumentException ex) 
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwera podczas inicjalizacji: {ex.Message}");
        }
       
    }
    
    // POST: api/CentroidManager/manual
    [HttpPost("manual")] 
    public ActionResult<IEnumerable<DataPointDto>> ManualInit([FromBody] List<DataPointDto> userCentroidDto)
    {
        try
        {
            var points = _mapper.Map<List<DataPoint>>(userCentroidDto);
            var centroids = _centroidManagerService.ManualInit(points);
            return Ok(_mapper.Map<List<DataPointDto>>(centroids));
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwera: {ex.Message}");
        }
    }
    
    // POST: api/CentroidManager/kmeansplus?k={k}
    [HttpPost("kmeansplus")]
    public ActionResult<IEnumerable<DataPointDto>> KMeansPlusPlusInit([FromBody] List<DataPointDto> pointsDto, [FromQuery] int k)
    {
        try
        {
            var points = _mapper.Map<List<DataPoint>>(pointsDto);
            var centroids = _centroidManagerService.KMeansPlusPlusInit(points, k);
            return Ok(_mapper.Map<List<DataPointDto>>(centroids));
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwera: {ex.Message}");
        }
    }
    
    // POST: api/CentroidManager/random?k={k}
    [HttpPost("random")]
    public ActionResult<IEnumerable<DataPointDto>> RandomInit([FromBody] List<DataPointDto> pointsDto, [FromQuery] int k)
    {
        try
        {
            var points = _mapper.Map<List<DataPoint>>(pointsDto);
            var centroids = _centroidManagerService.RandomInit(points, k);
            return Ok(_mapper.Map<DataPointDto>(centroids));
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwera: {ex.Message}");
        }
    }
    
    // POST: api/CentroidManager/add
    [HttpPost("add-centroid")]
    public IActionResult AddCentroid([FromBody] DataPointDto centroidDto)
    {
        try
        {
            _centroidManagerService.AddCentroid(centroidDto.X, centroidDto.Y); 
            var centroids = _centroidManagerService.GetCentroids();
            return Ok(centroids);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwera: {ex.Message}");
        }
    }
    
    [HttpPost("update-centroid")]
    public IActionResult UpdateCentroid([FromBody] DataPointDto centroidDto, [FromQuery] double newX, double newY)
    {
        try
        {
            _centroidManagerService.UpdateCentroid(centroidDto, newX, newY); 
            var centroids = _centroidManagerService.GetCentroids();
            return Ok(centroids);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwera: {ex.Message}");
        }
    }
    
    
    //DELETE: api/dataset/remove-centroid/{id}
    [HttpDelete("remove-centroid/{id}")]
    public IActionResult RemoveCentroid(int id)
    {
        try
        {
            _centroidManagerService.RemoveCentroid(id);
            return NoContent();
        }
        catch (ArgumentOutOfRangeException)
        {
            return NotFound("Punkt o podanym ID nie istnieje.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    // GET: api/CentroidManager
    [HttpGet]
    public ActionResult<IEnumerable<DataPointDto>> GetCentroids()
    {
        try
        {
            var centroids = _centroidManagerService.GetCentroids();
            if (!centroids.Any())
            {
                return NoContent(); 
            }
            return Ok(_mapper.Map<List<DataPointDto>>(centroids));
        }
        catch(Exception ex)
        {
            return StatusCode(500, $"Błąd serwera: {ex.Message}");
        }
    }
    
    [HttpDelete("clear-centroid")]
    public IActionResult ResetControidsParameters()
    {
        try
        {
            _centroidManagerService.ResetControidsParameters(); 
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwera: {ex.Message}");
        }
    }

    // GET: api/CentroidManager/clusterId
    [HttpGet("clusterId")]
    public ActionResult<int> SetClusterId()
    {
        try
        {
            var clusterId = _centroidManagerService.SetClusterId();
            return Ok(clusterId);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwera: {ex.Message}");
        }
    }
}