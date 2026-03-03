using KMeansProject.Services;
using Microsoft.AspNetCore.Mvc;

namespace KMeansProject.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FileManagerController : ControllerBase
{
    private readonly IFileManagerService _fileManagerService;

    public FileManagerController(IFileManagerService fileManagerService)
    {
        _fileManagerService = fileManagerService;
    }

    //wczytaj z przyciągniętego pliku
    [HttpPost("upload")]
    public IActionResult UploadCsv(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Brak pliku CSV.");

        try
        {
            var rawData = _fileManagerService.LoadCsvToStringList(file);
            var processedResultDto = _fileManagerService.PreprocessCsvData(rawData);

            return Ok(processedResultDto);
        }
        catch (FileNotFoundException)
        {
            return NotFound("Plik nie został znaleziony.");
        }
        catch (IOException ex)
        {
            return BadRequest($"Błąd odczytu pliku: {ex.Message}");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwera: {ex.Message}");
        }
    }

    //wczytaj ze ścieżki
    [HttpGet("load")]
    public IActionResult LoadCsv([FromQuery] string path)
    {
        if (string.IsNullOrEmpty(path))
            return BadRequest("Podaj ścieżkę do pliku CSV.");

        try
        {
            var rawData = _fileManagerService.LoadCsvToStringList(path);
            var processedResultDto = _fileManagerService.PreprocessCsvData(rawData);

            return Ok(processedResultDto);
        }
        catch (FileNotFoundException)
        {
            return NotFound("Plik o podanej ścieżce nie został znaleziony na serwerze.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Błąd serwera: {ex.Message}");
        }
    }
}
