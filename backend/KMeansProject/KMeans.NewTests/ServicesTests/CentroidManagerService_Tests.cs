using AutoMapper;
using KMeansProject.DTO;
using KMeansProject.Models;
using KMeansProject.Services;
using NSubstitute;

namespace KMeans.NewTests.ServicesTests;

public class CentroidManagerService_Tests
{
    private readonly IMapper _mapper = Substitute.For<IMapper>();

    private CentroidManagerService CreateSut() => new(_mapper);

    /// <summary>
    /// Tests for ManualInit / Initialization
    /// Testy metod ManualInit / Initialization
    /// </summary>
    [Fact]
    public void ManualInit_WithValidPoints_CreatesCentroidsWithCorrectCoordinatesAndIds()
    {
        // sprawdzamy czy centroidy są tworzone z poprawnymi współrzędnymi i id
        // Arrange
        var sut = CreateSut();
        var points = new List<DataPoint>
        {
            new(1.0, 2.0),
            new(3.0, 4.0),
            new(5.0, 6.0)
        };

        // Act
        var result = sut.ManualInit(points);

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal(1.0, result[0].X, 4);
        Assert.Equal(2.0, result[0].Y, 4);
        Assert.Equal(0, result[0].ClusterId);

        Assert.Equal(3.0, result[1].X, 4);
        Assert.Equal(4.0, result[1].Y, 4);
        Assert.Equal(1, result[1].ClusterId);

        Assert.Equal(5.0, result[2].X, 4);
        Assert.Equal(6.0, result[2].Y, 4);
        Assert.Equal(2, result[2].ClusterId);
    }

    [Fact]
    public void Initialization_WithManualMode_CreatesCentroidsFromDataSetPoints()
    {
        // sprawdzamy czy tryb manual tworzy centroidy z punktów zbioru
        // Arrange
        var sut = CreateSut();
        var dataSet = new DataSet
        {
            Points = new List<DataPoint>
            {
                new(1.0, 2.0),
                new(3.0, 4.0)
            }
        };

        // Act
        sut.Initialization(CentroidManager.CentroidMode.Manual, 2, dataSet);
        var result = sut.GetCentroids();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(1.0, result[0].X, 4);
        Assert.Equal(2.0, result[0].Y, 4);
        Assert.Equal(0, result[0].ClusterId);

        Assert.Equal(3.0, result[1].X, 4);
        Assert.Equal(4.0, result[1].Y, 4);
        Assert.Equal(1, result[1].ClusterId);
    }

    [Fact]
    public void Initialization_WithKMeansPlusPlusModeAndNullPoints_ThrowsException()
    {
        // sprawdzamy czy null w trybie kmeans++ rzuca wyjątek
        // Arrange
        var sut = CreateSut();

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
            sut.Initialization(CentroidManager.CentroidMode.KMeansPlusPlus, 2, null));
    }

    [Fact]
    public void Initialization_WithRandomMode_CreatesKCentroids()
    {
        // sprawdzamy czy tryb random tworzy zadaną liczbę centroidów
        // Arrange
        var sut = CreateSut();
        var dataSet = new DataSet
        {
            Points = new List<DataPoint>
            {
                new(1.0, 2.0),
                new(3.0, 4.0),
                new(5.0, 6.0)
            }
        };

        // Act
        sut.Initialization(CentroidManager.CentroidMode.Random, 2, dataSet);
        var result = sut.GetCentroids();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(0, result[0].ClusterId);
        Assert.Equal(1, result[1].ClusterId);
    }

    /// <summary>
    /// Tests for AddCentroid / GetCentroids / GetCentroid
    /// Testy metod AddCentroid / GetCentroids / GetCentroid
    /// </summary>
    [Fact]
    public void AddCentroid_WithValidCoordinates_AddsCentroid()
    {
        // sprawdzamy czy centroid jest poprawnie dodawany
        // Arrange
        var sut = CreateSut();

        // Act
        sut.AddCentroid(2.5, 7.5);
        var result = sut.GetCentroids();

        // Assert
        Assert.Single(result);
        Assert.Equal(2.5, result[0].X, 4);
        Assert.Equal(7.5, result[0].Y, 4);
        Assert.Equal(0, result[0].ClusterId);
    }

    [Fact]
    public void AddCentroid_WhenCalledTwice_AssignsSequentialClusterIds()
    {
        // sprawdzamy czy kolejne centroidy dostają kolejne id
        // Arrange
        var sut = CreateSut();

        // Act
        sut.AddCentroid(1.0, 2.0);
        sut.AddCentroid(3.0, 4.0);
        var result = sut.GetCentroids();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(0, result[0].ClusterId);
        Assert.Equal(1, result[1].ClusterId);
    }

    /// <summary>
    /// Tests for UpdateCentroid
    /// Testy metody UpdateCentroid
    /// </summary>
    [Fact]
    public void UpdateCentroid_WithValidDto_UpdatesCoordinatesAndReturnsMappedCentroid()
    {
        // sprawdzamy czy centroid zmienia współrzędne i jest mapowany
        // Arrange
        var sut = CreateSut();
        sut.AddCentroid(1.0, 2.0);

        var dto = new DataPointDto
        {
            ClusterId = 0,
            X = 1.0,
            Y = 2.0
        };

        _mapper.Map<DataPoint>(Arg.Any<DataPoint>())
            .Returns(call =>
            {
                var point = call.Arg<DataPoint>();
                return new DataPoint(point.X, point.Y, point.ClusterId);
            });

        // Act
        var result = sut.UpdateCentroid(dto, 9.0, 8.0);
        var centroids = sut.GetCentroids();

        // Assert
        Assert.Equal(9.0, result.X, 4);
        Assert.Equal(8.0, result.Y, 4);
        Assert.Equal(0, result.ClusterId);

        Assert.Equal(9.0, centroids[0].X, 4);
        Assert.Equal(8.0, centroids[0].Y, 4);
        _mapper.Received(1).Map<DataPoint>(Arg.Any<DataPoint>());
    }

    [Fact]
    public void UpdateCentroid_WithInvalidClusterId_ThrowsException()
    {
        // sprawdzamy czy niepoprawne id rzuca wyjątek
        // Arrange
        var sut = CreateSut();
        var dto = new DataPointDto { ClusterId = 0 };

        // Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() => sut.UpdateCentroid(dto, 5.0, 6.0));
    }

    /// <summary>
    /// Tests for RemoveCentroid
    /// Testy metody RemoveCentroid
    /// </summary>
    [Fact]
    public void RemoveCentroid_WithValidId_RemovesCentroid()
    {
        // sprawdzamy czy centroid jest usuwany dla poprawnego id
        // Arrange
        var sut = CreateSut();
        sut.AddCentroid(1.0, 2.0);
        sut.AddCentroid(3.0, 4.0);

        // Act
        sut.RemoveCentroid(0);
        var result = sut.GetCentroids();

        // Assert
        Assert.Single(result);
        Assert.Equal(3.0, result[0].X, 4);
        Assert.Equal(4.0, result[0].Y, 4);
    }

    [Fact]
    public void RemoveCentroid_WithInvalidId_ThrowsException()
    {
        // sprawdzamy czy błędne id rzuca wyjątek
        // Arrange
        var sut = CreateSut();

        // Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() => sut.RemoveCentroid(0));
    }

    /// <summary>
    /// Tests for RandomInit / KMeansPlusPlusInit
    /// Testy metod RandomInit / KMeansPlusPlusInit
    /// </summary>
    [Fact]
    public void RandomInit_WithValidPointsAndK_ReturnsKCentroids()
    {
        // sprawdzamy czy random init zwraca zadaną liczbę centroidów
        // Arrange
        var sut = CreateSut();
        var points = new List<DataPoint>
        {
            new(1.0, 2.0),
            new(3.0, 4.0),
            new(5.0, 6.0)
        };

        // Act
        var result = sut.RandomInit(points, 2);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(0, result[0].ClusterId);
        Assert.Equal(1, result[1].ClusterId);
    }

    [Fact]
    public void RandomInit_ClearsPreviousCentroidsBeforeCreatingNewOnes()
    {
        // sprawdzamy czy random init czyści poprzednie centroidy
        // Arrange
        var sut = CreateSut();
        sut.AddCentroid(100.0, 200.0);

        var points = new List<DataPoint>
        {
            new(1.0, 2.0),
            new(3.0, 4.0),
            new(5.0, 6.0)
        };

        // Act
        var result = sut.RandomInit(points, 2);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.DoesNotContain(result, c => c.X == 100.0 && c.Y == 200.0);
    }

    [Fact]
    public void KMeansPlusPlusInit_WithValidPointsAndK_ReturnsKCentroids()
    {
        // sprawdzamy czy kmeans++ zwraca zadaną liczbę centroidów
        // Arrange
        var sut = CreateSut();
        var points = new List<DataPoint>
        {
            new(1.0, 2.0),
            new(3.0, 4.0),
            new(5.0, 6.0),
            new(7.0, 8.0)
        };

        // Act
        var result = sut.KMeansPlusPlusInit(points, 2);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(0, result[0].ClusterId);
        Assert.Equal(1, result[1].ClusterId);
    }

    /// <summary>
    /// Tests for ResetControidsParameters / SetClusterId / GetCentroids
    /// Testy metod ResetControidsParameters / SetClusterId / GetCentroids
    /// </summary>
    [Fact]
    public void ResetControidsParameters_ClearsAllCentroids()
    {
        // sprawdzamy czy reset usuwa wszystkie centroidy
        // Arrange
        var sut = CreateSut();
        sut.AddCentroid(1.0, 2.0);
        sut.AddCentroid(3.0, 4.0);

        // Act
        sut.ResetControidsParameters();

        // Assert
        Assert.Empty(sut.GetCentroids());
    }

    [Fact]
    public void SetClusterId_WhenNoCentroidsExist_ReturnsZero()
    {
        // sprawdzamy czy dla pustej listy zwracane jest zero
        // Arrange
        var sut = CreateSut();

        // Act
        var result = sut.SetClusterId();

        // Assert
        Assert.Equal(0, result);
    }

    [Fact]
    public void SetClusterId_WhenCentroidsExist_ReturnsCount()
    {
        // sprawdzamy czy zwracana jest liczba centroidów
        // Arrange
        var sut = CreateSut();
        sut.AddCentroid(1.0, 2.0);
        sut.AddCentroid(3.0, 4.0);

        // Act
        var result = sut.SetClusterId();

        // Assert
        Assert.Equal(2, result);
    }

    [Fact]
    public void GetCentroids_ReturnsCurrentCentroids()
    {
        // sprawdzamy czy zwracana jest aktualna lista centroidów
        // Arrange
        var sut = CreateSut();
        sut.AddCentroid(1.0, 2.0);
        sut.AddCentroid(3.0, 4.0);

        // Act
        var result = sut.GetCentroids();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(1.0, result[0].X, 4);
        Assert.Equal(2.0, result[0].Y, 4);
        Assert.Equal(3.0, result[1].X, 4);
        Assert.Equal(4.0, result[1].Y, 4);
    }
}