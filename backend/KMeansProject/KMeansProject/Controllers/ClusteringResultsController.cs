using KMeansProject.DTO;
using KMeansProject.Services;
using Microsoft.AspNetCore.Mvc;

namespace KMeansProject.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClusteringResultsController: ControllerBase
{
    private readonly  IClusteringResultsService _clusteringResultsService;

    public ClusteringResultsController(IClusteringResultsService clusteringResultsService)
    {
        _clusteringResultsService = clusteringResultsService;
    }
    [HttpPost("best-results")]
    public async Task<IActionResult> GetBestResults([FromBody] DataSetDto data)
    {
        if (!data.Points.Any()) return BadRequest("Brak danych.");
        try
        {
            var results = await _clusteringResultsService.BestResultsForDataSet(data);
            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("algorithm-results")]
    public async Task<IActionResult> Evaluate([FromBody] ClusteringRequestDto request)
    {
        if (request.K <= 0)
            return BadRequest("Żądanie (DataSet i K > 0) jest wymagane.");
        try
        {
            var results = await _clusteringResultsService.KMeansAlgotithmResults(request.DataSet, request.K);
                return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}