using KMeansProject.Models;

namespace KMeans.NewTests.OtherTests;

public class EuclideanMetric_Tests
{
    private readonly EuclideanMetric _sut = new();

    [Fact]
    public void CalculateDistance_BetweenSamePoints_ReturnsZero()
    {
        // Arrange
        var p = new DataPoint(2, 1);
        
        // Act & Assert
        Assert.Equal(0, _sut.CalculateDistance(p, p));
    }

    [Fact]
    public void CalculateDistance_InKnownRectangularTriangle_ReturnsProperValue()
    {
        // Arrange
        var p1 = new DataPoint(0, 0);
        var p2 = new DataPoint(3, 4);
        
        // Act & Assert
        Assert.Equal(5, _sut.CalculateDistance(p1, p2), 4);
    }

    [Fact]
    public void CalculateDistance_IsSymmetric()
    {
        // Arrange
        var p1 = new DataPoint(2, 1);
        var p2 = new DataPoint(3, 7);
        
        // Act & Assert
        Assert.Equal(_sut.CalculateDistance(p1, p2), _sut.CalculateDistance(p2, p1));
    }
    
    [Fact]
    public void CalculateDistance_WithNegativeCoordinates_WorksCorrectly()
    {
        // Arrange
        var p1 = new DataPoint(0,0);
        var p2 = new DataPoint(-3,4);
        var p3 = new DataPoint(3, -4);
        var p4 = new DataPoint(-3,-4);
        
        // Act & Assert
        Assert.Equal(5, _sut.CalculateDistance(p1, p2), 4);
        Assert.Equal(5, _sut.CalculateDistance(p1, p3), 4);
        Assert.Equal(5, _sut.CalculateDistance(p1, p4), 4);
    }
}