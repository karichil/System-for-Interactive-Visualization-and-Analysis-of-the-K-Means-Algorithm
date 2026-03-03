using AutoMapper;
using KMeansProject.DTO;
using KMeansProject.Services;
using Microsoft.AspNetCore.Mvc;

namespace KMeansProject.Controllers;


[ApiController]
[Route("api/[controller]")]
public class DataSetController:ControllerBase
{
    private readonly IDataSetService _dataSetService;
    private readonly IMapper _mapper;

    public DataSetController(IDataSetService dataSetService, IMapper mapper)
    {
        _dataSetService = dataSetService;
        _mapper = mapper;
    }
    
    //GET: api/dataset
    [HttpGet]
    public ActionResult<IEnumerable<DataPointDto>> GetPoints()
    {
        try
        {
            var points = _dataSetService.GetPoints();
            if (!points.Any())
                return NoContent(); // 204 No Content
            return Ok(_mapper.Map<IEnumerable<DataPointDto>>(points));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
    
    //GET: api/dataset/{id}
    [HttpGet("{id}")]
    public ActionResult<DataPointDto> GetPoint(int id)
    {
        try
        {
            var point = _dataSetService.GetPoint(id);
            return Ok(_mapper.Map<DataPointDto>(point));
        }
        catch(ArgumentOutOfRangeException)
        {
            return NotFound("Punkt o podanym ID nie istnieje.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
    
    //PUT: api/dataset/create
    [HttpPost("create")]
    public ActionResult<DataPointDto> CreateDataSet([FromBody] DataSetRequestDto datasetRequestDto)
    {
        try
        {
            var dataset = _dataSetService.CreateDataSet(datasetRequestDto);
            return Ok(_mapper.Map<DataSetDto>(dataset));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
    
    //PUT: api/dataset/update-axes
    [HttpPut("update-axes")]
    public ActionResult<DataSetDto> UpdateDataSetAxes([FromBody] DataSetRequestDto datasetRequestDto)
    {
        try
        {
            var dataset = _dataSetService.UpdateDataSetAxes(datasetRequestDto);
            return Ok(_mapper.Map<DataSetDto>(dataset));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
    
    //POST: api/dataset/add-point
    [HttpPost("add-point")]
    public IActionResult AddPoint([FromBody] DataPointDto dataPointDto)
    {
        try
        {
            _dataSetService.AddPoint(dataPointDto);
            var dataSet = _dataSetService.GetPoints();
            return Ok(dataSet);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    //PUT: api/dataset/update-point/{id}
    [HttpPut("update-point/{id}")]
    public IActionResult UpdatePoint([FromQuery] int pointId, [FromQuery] double newX, [FromQuery] double newY)
    {
        try
        {
            _dataSetService.UpdatePoint(pointId, newX, newY);
            return Ok();
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

    //DELETE: api/dataset/remove-point/{id}
    [HttpDelete("remove-point/{id}")]
    public IActionResult RemovePoint(int id)
    {
        try
        {
            _dataSetService.RemovePoint(id);
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
    
    [HttpDelete("reset-data")]
    public IActionResult ResetData()
    {
        try
        {
            _dataSetService.ResetData();
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
}