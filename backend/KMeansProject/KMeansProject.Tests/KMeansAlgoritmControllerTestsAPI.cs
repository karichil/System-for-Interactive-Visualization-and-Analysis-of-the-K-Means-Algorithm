using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using KMeansProject.DTO;
using System.Collections.Generic;

public class KMeansAlgoritmControllerTests
{
    private readonly HttpClient _client;

    public KMeansAlgoritmControllerTests()
    {
        _client = new WebApplicationFactory<Program>()
            .CreateClient();
    }

    private AlgorithmInitRequestDto CreateValidRequest()
    {
        return new AlgorithmInitRequestDto
        {
            DataSet = new DataSetDto
            {
                Points = new List<DataPointDto>
                {
                    new() { X = 1, Y = 2 },
                    new() { X = 2, Y = 3 },
                    new() { X = 8, Y = 8 }
                }
            },
            CentroidManager = new CentroidManagerDto
            {
                Centroids = new List<DataPointDto>
                {
                    new() { X = 1, Y = 2 },
                    new() { X = 8, Y = 8 }
                }
            },
            MetricName = "Euclidean",
            MaxIterations = 10
        };
    }

    private async Task InitializeAsync()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/KMeansAlgoritm/initialize",
            CreateValidRequest()
        );

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // 1️⃣ INIT
    [Fact]
    public async Task Initialize_ShouldReturnCentroids()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/KMeansAlgoritm/initialize",
            CreateValidRequest()
        );

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<List<DataPointDto>>();

        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
    }

    // 2️⃣ STEP FORWARD
    [Fact]
    public async Task StepForward_ShouldReturnUpdatedState()
    {
        await InitializeAsync();

        var response = await _client.PostAsync(
            "/api/KMeansAlgoritm/step-forward",
            null
        );

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<AlgorithmResultDto>();

        result.Should().NotBeNull();
        result!.Centroids.Should().NotBeNull();
        result.Points.Should().NotBeNullOrEmpty();

        result.Points.Should().AllSatisfy(p =>
            p.ClusterId.Should().BeGreaterThanOrEqualTo(0)
        );
    }

    // 3️⃣ STATUS (REPLACED FIX FOR YOUR FAILING TEST)
    [Fact]
    public async Task Status_ShouldReturnCurrentCentroids()
    {
        await InitializeAsync();

        var response = await _client.GetAsync(
            "/api/KMeansAlgoritm/status"
        );

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<List<DataPointDto>>();

        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
    }
}