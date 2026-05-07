using AutoMapper;
using KMeans.NewTests.Helpers;
using KMeansProject.Controllers;
using KMeansProject.DTO;
using KMeansProject.Models;
using KMeansProject.Services;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;

namespace KMeans.NewTests.APITests;

public class CentroidManagerController_APITests
{
    private readonly ICentroidManagerService _service = Substitute.For<ICentroidManagerService>();
    private readonly IMapper _mapper = MapperFactory.CreateMapper();

    private CentroidManagerController CreateSut() => new(_service, _mapper);

    private static List<DataPointDto> SamplePointsDto() =>
    [
        new DataPointDto { X = 1, Y = 2, ClusterId = 0 },
        new DataPointDto { X = 3, Y = 4, ClusterId = 1 }
    ];

    private static List<DataPoint> SamplePointsModel() =>
    [
        new DataPoint(1, 2, 0),
        new DataPoint(3, 4, 1)
    ];

    [Fact]
    public void Initialization_WithValidData_Returns_200_AndCentroids()
    {
        // Arrange
        var pointsDto = new DataSetDto { Points = SamplePointsDto() };
        var centroids = SamplePointsModel();
        _service.GetCentroids().Returns(centroids);

        // Act
        var result = CreateSut().Initialization(CentroidManager.CentroidMode.Random, 2, pointsDto) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var payload = Assert.IsType<List<DataPointDto>>(result.Value);
        Assert.Equal(2, payload.Count);
        _service.Received(1).Initialization(
            CentroidManager.CentroidMode.Random,
            2,
            Arg.Is<DataSet>(d => d.Points.Count == 2));
    }

    [Fact]
    public void ManualInit_WithValidData_Returns_200_AndCentroids()
    {
        // Arrange
        var input = SamplePointsDto();
        var centroids = SamplePointsModel();
        _service.ManualInit(Arg.Any<List<DataPoint>>()).Returns(centroids);

        // Act
        var result = CreateSut().ManualInit(input).Result as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var payload = Assert.IsType<List<DataPointDto>>(result.Value);
        Assert.Equal(2, payload.Count);
        _service.Received(1).ManualInit(Arg.Is<List<DataPoint>>(p => p.Count == 2));
    }

    [Fact]
    public void KMeansPlusPlusInit_WithValidData_Returns_200_AndCentroids()
    {
        // Arrange
        var input = SamplePointsDto();
        var centroids = SamplePointsModel();
        _service.KMeansPlusPlusInit(Arg.Any<List<DataPoint>>(), 2).Returns(centroids);

        // Act
        var result = CreateSut().KMeansPlusPlusInit(input, 2).Result as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var payload = Assert.IsType<List<DataPointDto>>(result.Value);
        Assert.Equal(2, payload.Count);
        _service.Received(1).KMeansPlusPlusInit(Arg.Is<List<DataPoint>>(p => p.Count == 2), 2);
    }

    [Fact]
    public void RemoveCentroid_WithValidId_Returns_204()
    {
        // Act
        var result = CreateSut().RemoveCentroid(0);

        // Assert
        Assert.IsType<NoContentResult>(result);
        _service.Received(1).RemoveCentroid(0);
    }

    [Fact]
    public void UpdateCentroid_WithValidData_Returns_200_AndUpdatedCollection()
    {
        // Arrange
        var centroidDto = new DataPointDto { X = 1, Y = 2, ClusterId = 0 };
        var updatedCentroid = new DataPoint(10, 20, 0);
        var allCentroids = new List<DataPoint> { updatedCentroid, new(3, 4, 1) };

        _service.UpdateCentroid(centroidDto, 10, 20).Returns(updatedCentroid);
        _service.GetCentroids().Returns(allCentroids);

        // Act
        var result = CreateSut().UpdateCentroid(centroidDto, 10, 20) as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        var payload = Assert.IsType<List<DataPoint>>(result.Value);
        Assert.Equal(2, payload.Count);
        _service.Received(1).UpdateCentroid(centroidDto, 10, 20);
    }
}
