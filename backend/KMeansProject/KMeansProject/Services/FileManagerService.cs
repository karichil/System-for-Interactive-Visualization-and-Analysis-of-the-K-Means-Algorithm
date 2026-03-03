using System.Globalization;
using KMeansProject.DTO;

namespace KMeansProject.Services;

public interface IFileManagerService
{
    List<string> LoadCsvToStringList(string filePath);
    List<string> LoadCsvToStringList(IFormFile csvFile);
    FileProcessResultDto PreprocessCsvData(List<string> csvData);
}

public class FileManagerService : IFileManagerService
{
    public List<string> LoadCsvToStringList(string filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            throw new FileNotFoundException("Plik nie istnieje lub ścieżka jest nieprawidłowa.");
        
        var extension = Path.GetExtension(filePath);
        if (!extension.Equals(".csv", StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException($"Nieprawidłowy format pliku ({extension}). Dozwolone tylko pliki CSV.");
        
        var fileInfo = new FileInfo(filePath);
        if (fileInfo.Length == 0)
            throw new InvalidDataException("Plik jest pusty.");
        
        try
        {
            var lines = File.ReadAllLines(filePath).ToList();

            if (lines.Count == 0)
                throw new InvalidDataException("Plik CSV nie zawiera żadnych danych.");

            return lines;
        }
        catch (Exception ex)
        {
            throw new InvalidDataException($"Błąd podczas odczytu pliku CSV: {ex.Message}");
        }
    }
    
    public List<string> LoadCsvToStringList(IFormFile csvFile)
    {
        if (csvFile == null || csvFile.Length == 0)
            return null;

        var extension = Path.GetExtension(csvFile.FileName);
        var contentType = csvFile.ContentType;
        
        if (!extension.Equals(".csv", StringComparison.OrdinalIgnoreCase) &&
            !contentType.Equals("text/csv", StringComparison.OrdinalIgnoreCase) &&
            !contentType.Equals("application/vnd.ms-excel", StringComparison.OrdinalIgnoreCase)) // niektóre przeglądarki tak wysyłają CSV
        {
            throw new InvalidDataException($"Nieprawidłowy format pliku ({extension}). Dozwolone tylko CSV.");
        }

        var data = new List<string>();
        using (var reader = new StreamReader(csvFile.OpenReadStream()))
        {
            while (!reader.EndOfStream)
            {
                var line = reader.ReadLine();
                data.Add(line);
            }
        }

        return data;
    }

    public FileProcessResultDto PreprocessCsvData(List<string> csvData)
    {
        var headers = csvData.First().Split(',',';').ToList(); 
        var parsedData = csvData
            .Skip(1) 
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Select(line => line.Split(',',';').ToList())
            .ToList();
        
        if (parsedData.Count == 0)
            throw new InvalidDataException("Plik CSV nie zawiera danych.");
        
        int expectedCols = headers.Count;
        if (parsedData.Any(row => row.Count != expectedCols))
            throw new InvalidDataException("Niespójna liczba kolumn w wierszach. Sprawdź format pliku CSV.");
        
        var result = new List<List<double>>();

        for (int i = 0; i < parsedData.Count; i++)
        {
            var rowStrings = parsedData[i];
            var rowDoubles = new List<double>();

            for (int j = 0; j < rowStrings.Count; j++)
            {
                string cellValue = rowStrings[j];
                
                if (double.TryParse(cellValue, NumberStyles.Any, CultureInfo.InvariantCulture, out double val))
                {
                    rowDoubles.Add(val);
                }
                else
                {
                    throw new InvalidDataException(
                        $"Błąd danych w wierszu {i + 1}, kolumna '{headers[j]}'. " +
                        $"Wartość '{cellValue}' nie jest liczbą. " +
                        "Upewnij się, że dane są numeryczne i nie zawierają pustych pól.");
                }
            }
            result.Add(rowDoubles);
        }
        
        return new FileProcessResultDto
            {
                Headers = headers,
                ProcessedData = result
            };
    }
}