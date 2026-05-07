using AutoMapper;
using KMeansProject.Models;
using KMeansProject.Services;
using Microsoft.AspNetCore.SignalR;
using Moq;

namespace KMeansProject.Tests;

public class CentroidManagerServiceTests
{
    private readonly CentroidManagerService _service;
    private readonly Mock<IMapper> _mapperMock;

    public CentroidManagerServiceTests()
    {
        _mapperMock = new Mock<IMapper>();
        _service = new CentroidManagerService(_mapperMock.Object);
    }

    [Fact]
    public void GetCentroid_ValidIndex_ReturnsCorrectCentroid()
    {
        // Arrange
        _service.ResetControidsParameters();
        _service.AddCentroid(11.1, 22.2);
        _service.AddCentroid(33.3, 44.4);

        // Act
        var result = _service.GetCentroid(1);

        // Assert
        Assert.Equal(33.3, result.X);
        Assert.Equal(44.4, result.Y);
        Assert.Equal(1, result.ClusterId);
    }

    [Fact]
    public void GetCentroid_WithNegativeId_ThrowsArgumentOutOfRangeException()
    {
        // Arrange
        _service.ResetControidsParameters();
        _service.AddCentroid(10.0, 10.0);

        // Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() => _service.GetCentroid(-1));
    }

    [Fact]
    public void GetCentroid_WithIdGreaterThanCount_ThrowsArgumentOutOfRangeException()
    {
        // Arrange
        _service.ResetControidsParameters();
        _service.AddCentroid(10.0, 10.0);

        // Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() => _service.GetCentroid(1)); 
    }

    [Fact]
    public void SetClusterId_ReflectsExactNumberOfAddedCentroids()
    {
        // Arrange
        _service.ResetControidsParameters();

        // Act
        _service.AddCentroid(1.0, 1.0);
        _service.AddCentroid(2.0, 2.0);
        _service.AddCentroid(3.0, 3.0);
        _service.RemoveCentroid(0); 

        var count = _service.SetClusterId();

        // Assert
        Assert.Equal(2, count);
    }

    [Fact]
    public void KMeansPlusPlusInit_AlwaysPutsFirstCentroidAtZeroClusterId()
    {
        // Arrange
        var points = new List<DataPoint> { new DataPoint(5.0, 5.0), new DataPoint(10.0, 10.0) };

        // Act
        var centroids = _service.KMeansPlusPlusInit(points, 2);

        // Assert
        Assert.Equal(0, centroids[0].ClusterId);
       
        Assert.True(centroids.All(c => c.ClusterId >= 0 && c.ClusterId < 2));
    }
}