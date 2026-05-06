using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using KMeansProject.DTO;
using Microsoft.Playwright;

namespace KMeansProject.Tests;

public sealed class KMeansApiFixture : IAsyncLifetime
{
    private Process? _process;

    public string BaseUrl { get; private set; } = string.Empty;

    public async Task InitializeAsync()
    {
        BaseUrl = $"http://127.0.0.1:{GetFreePort()}";

        var startInfo = new ProcessStartInfo
        {
            FileName = "dotnet",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };

        startInfo.ArgumentList.Add("run");
        startInfo.ArgumentList.Add("--no-launch-profile");
        startInfo.ArgumentList.Add("--urls");
        startInfo.ArgumentList.Add(BaseUrl);
        startInfo.ArgumentList.Add("--project");
        startInfo.ArgumentList.Add(Path.Combine(GetSolutionRoot(), "KMeansProject", "KMeansProject.csproj"));
        startInfo.Environment["DOTNET_ROLL_FORWARD"] = "Major";

        _process = Process.Start(startInfo) ?? throw new InvalidOperationException("Could not start API.");

        await WaitForApiAsync();
    }

    public Task DisposeAsync()
    {
        if (_process is { HasExited: false })
        {
            _process.Kill(entireProcessTree: true);
            _process.Dispose();
        }

        return Task.CompletedTask;
    }

    private async Task WaitForApiAsync()
    {
        using var client = new HttpClient();
        var deadline = DateTime.UtcNow.AddSeconds(30);

        while (DateTime.UtcNow < deadline)
        {
            if (_process?.HasExited == true)
            {
                var stdout = await _process.StandardOutput.ReadToEndAsync();
                var stderr = await _process.StandardError.ReadToEndAsync();
                throw new InvalidOperationException($"API exited before startup completed.{Environment.NewLine}{stdout}{Environment.NewLine}{stderr}");
            }

            try
            {
                using var response = await client.GetAsync($"{BaseUrl}/api/CentroidManager");
                if (response.StatusCode is HttpStatusCode.OK or HttpStatusCode.NoContent)
                    return;
            }
            catch (HttpRequestException)
            {
                await Task.Delay(250);
            }
        }

        throw new TimeoutException("API did not start in the expected time.");
    }

    private static int GetFreePort()
    {
        var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    private static string GetSolutionRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "KMeansProject.sln")))
            directory = directory.Parent;

        return directory?.FullName
               ?? throw new InvalidOperationException("Could not find KMeansProject solution directory.");
    }
}

public sealed class CentroidManagerControllerPlaywrightTests : IClassFixture<KMeansApiFixture>, IAsyncLifetime
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly KMeansApiFixture _fixture;
    private IPlaywright? _playwright;
    private IAPIRequestContext? _request;

    public CentroidManagerControllerPlaywrightTests(KMeansApiFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        _playwright = await Playwright.CreateAsync();
        _request = await _playwright.APIRequest.NewContextAsync(new APIRequestNewContextOptions
        {
            BaseURL = _fixture.BaseUrl
        });

        await _request.DeleteAsync("/api/CentroidManager/clear-centroid");
    }

    public async Task DisposeAsync()
    {
        if (_request is not null)
            await _request.DisposeAsync();

        _playwright?.Dispose();
    }

    [Fact]
    public async Task ClearCentroid_ShouldReturnOk()
    {
        var response = await Request.DeleteAsync("/api/CentroidManager/clear-centroid");

        Assert.Equal((int)HttpStatusCode.OK, response.Status);
    }

    [Fact]
    public async Task AddCentroid_ShouldReturnCreatedCentroid()
    {
        var response = await Request.PostAsync("/api/CentroidManager/add-centroid", new APIRequestContextOptions
        {
            DataObject = new DataPointDto { X = 12.5, Y = 8.25 }
        });

        var centroids = DeserializeCentroids(await response.TextAsync());

        Assert.Equal((int)HttpStatusCode.OK, response.Status);
        var centroid = Assert.Single(centroids);
        Assert.Equal(12.5, centroid.X);
        Assert.Equal(8.25, centroid.Y);
        Assert.Equal(0, centroid.ClusterId);
    }

    [Fact]
    public async Task GetCentroids_ShouldReturnCurrentCentroids()
    {
        await Request.PostAsync("/api/CentroidManager/add-centroid", new APIRequestContextOptions
        {
            DataObject = new DataPointDto { X = 3, Y = 4 }
        });

        var response = await Request.GetAsync("/api/CentroidManager");
        var centroids = DeserializeCentroids(await response.TextAsync());

        Assert.Equal((int)HttpStatusCode.OK, response.Status);
        var centroid = Assert.Single(centroids);
        Assert.Equal(3, centroid.X);
        Assert.Equal(4, centroid.Y);
        Assert.Equal(0, centroid.ClusterId);
    }

    private IAPIRequestContext Request =>
        _request ?? throw new InvalidOperationException("Playwright request context was not initialized.");

    private static List<DataPointDto> DeserializeCentroids(string json) =>
        JsonSerializer.Deserialize<List<DataPointDto>>(json, JsonOptions)
        ?? throw new JsonException("API returned an empty centroid list.");
}
