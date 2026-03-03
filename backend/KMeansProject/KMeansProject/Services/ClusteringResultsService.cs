using System.Diagnostics;
using System.Text.Json;
using KMeansProject.DTO;

namespace KMeansProject.Services;

public interface IClusteringResultsService
{
    Task<BestResultDto> BestResultsForDataSet(DataSetDto datasetDto);
    Task<Dictionary<string, double>> KMeansAlgotithmResults(DataSetDto datasetDto, int k);
}

public class ClusteringResultsService : IClusteringResultsService
{
    private readonly string _pythonPath;
    private readonly string _scriptsDir;

    public ClusteringResultsService(IConfiguration configuration)
    {
        _pythonPath = configuration["PythonSettings:InterpreterPath"];
        _scriptsDir = configuration["PythonSettings:ScriptsPath"];
    }

    public async Task<BestResultDto> BestResultsForDataSet(DataSetDto datasetDto)
    {
        var datasetList = datasetDto.Points.Select(p => new List<double> { p.X, p.Y }).ToList();
        string jsonData = JsonSerializer.Serialize(datasetList);

        string tempInputPath = Path.GetTempFileName();

        try
        {
            await File.WriteAllTextAsync(tempInputPath, jsonData);

            var psi = new ProcessStartInfo
            {
                FileName = _pythonPath,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };

            psi.ArgumentList.Add(Path.Combine(_scriptsDir, "main.py"));
            psi.ArgumentList.Add(tempInputPath);

            psi.EnvironmentVariables["OMP_NUM_THREADS"] = "1";

            using var process = new Process();
            process.StartInfo = psi;
            
            var outputBuilder = new System.Text.StringBuilder();
            var errorBuilder = new System.Text.StringBuilder();

            process.OutputDataReceived += (sender, e) => { if (e.Data != null) outputBuilder.AppendLine(e.Data); };
            process.ErrorDataReceived += (sender, e) => { if (e.Data != null) errorBuilder.AppendLine(e.Data); };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            await process.WaitForExitAsync();

            string output = outputBuilder.ToString();
            string error = errorBuilder.ToString();
            
            if (!string.IsNullOrWhiteSpace(output)) Console.WriteLine("Python Output (Best): " + output);

            if (process.ExitCode != 0)
            {
                Console.WriteLine($"Python Error: {error}");
                throw new Exception($"Python script failed: {error}");
            }
            try 
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var result = JsonSerializer.Deserialize<BestResultDto>(output, options);
                
                if (result == null) throw new Exception("Deserialized result is null.");
                
                return result;
            }
            catch (JsonException jex)
            {
                throw new Exception($"Failed to parse Python JSON. Output was: [{output}]. Error: {jex.Message}");
            }
        }
        finally
        {
            if (File.Exists(tempInputPath)) try { File.Delete(tempInputPath); } catch { }
        }
    }

    public async Task<Dictionary<string, double>> KMeansAlgotithmResults(DataSetDto datasetDto, int k)
    {
        var requestData = new
        {
            Data = datasetDto.Points.Select(p => new List<double> { p.X, p.Y }).ToList(),
            Labels = datasetDto.Points.Select(p => p.ClusterId).ToList()
        };

        string jsonData = JsonSerializer.Serialize(requestData);
        string tempInputPath = Path.GetTempFileName();

        try
        {
            await File.WriteAllTextAsync(tempInputPath, jsonData);

            var psi = new ProcessStartInfo
            {
                FileName = _pythonPath,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };

            psi.ArgumentList.Add(Path.Combine(_scriptsDir, "eval_final.py"));
            psi.ArgumentList.Add(tempInputPath);

            psi.EnvironmentVariables["OMP_NUM_THREADS"] = "1";

            using var process = new Process();
            process.StartInfo = psi;
            process.Start();

            var outputTask = process.StandardOutput.ReadToEndAsync();
            var errorTask = process.StandardError.ReadToEndAsync();
            
            await process.WaitForExitAsync();

            string output = await outputTask;
            string error = await errorTask;

            if (process.ExitCode != 0)
            {
                Console.WriteLine("Python Error (Eval): " + error);
                throw new Exception($"Python script failed: {error}");
            }

            Console.WriteLine("Python Output (Eval): " + output);
            
            try 
            {
                var results = JsonSerializer.Deserialize<Dictionary<string, double>>(output);
                if (results == null) throw new Exception("Results are null");
                return results;
            }
            catch (JsonException jex)
            {
                throw new Exception($"Failed to parse Python JSON. Output was: [{output}]. Error: {jex.Message}");
            }
            
        }
        finally
        {
            if (File.Exists(tempInputPath)) try { File.Delete(tempInputPath); } catch { }
        }
    }
}