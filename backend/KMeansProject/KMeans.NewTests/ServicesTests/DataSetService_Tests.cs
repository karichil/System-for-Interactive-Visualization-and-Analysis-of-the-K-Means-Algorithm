using AutoMapper;
using KMeansProject.DTO;
using KMeansProject.Models;
using KMeansProject.Services;
using NSubstitute;

namespace KMeans.NewTests.ServicesTests;

public class DataSetService_Tests
{
    private readonly IMapper _mapper = Substitute.For<IMapper>();
    private readonly ICentroidManagerService _centroidManager = Substitute.For<ICentroidManagerService>();

    private DataSetService CreateSut() => new(_mapper, _centroidManager);

    /// <summary>
    /// Tests for CreateDataSet / UpdateDataSetAxes
    /// Testy metod CreateDataSet / UpdateDataSetAxes
    /// </summary>
    [Fact]
    public void CreateDataSet_WithValidRequest_CreatesPointsFromSelectedAxes()
    {
        // sprawdzamy czy punkty są tworzone z wybranych osi
        // Arrange
        var sut = CreateSut();
        var request = new DataSetRequestDto
        {
            X = 0,
            Y = 2,
            Data = new List<List<double>>
            {
                new() { 1.0, 5.0, 10.0 },
                new() { 2.0, 6.0, 20.0 },
                new() { 3.0, 7.0, 30.0 }
            }
        };

        // Act
        var result = sut.CreateDataSet(request);

        // Assert
        Assert.Equal(3, result.Points.Count);
        Assert.Equal(1.0, result.Points[0].X, 4);
        Assert.Equal(10.0, result.Points[0].Y, 4);
        Assert.Equal(2.0, result.Points[1].X, 4);
        Assert.Equal(20.0, result.Points[1].Y, 4);
        Assert.Equal(3.0, result.Points[2].X, 4);
        Assert.Equal(30.0, result.Points[2].Y, 4);
    }

    [Fact]
    public void CreateDataSet_WhenCalledAgain_ClearsPreviousPoints()
    {
        // sprawdzamy czy poprzednie punkty są czyszczone
        // Arrange
        var sut = CreateSut();

        var firstRequest = new DataSetRequestDto
        {
            X = 0,
            Y = 1,
            Data = new List<List<double>>
            {
                new() { 1.0, 2.0 },
                new() { 3.0, 4.0 }
            }
        };

        var secondRequest = new DataSetRequestDto
        {
            X = 0,
            Y = 1,
            Data = new List<List<double>>
            {
                new() { 9.0, 8.0 }
            }
        };

        sut.CreateDataSet(firstRequest);

        // Act
        var result = sut.CreateDataSet(secondRequest);

        // Assert
        Assert.Single(result.Points);
        Assert.Equal(9.0, result.Points[0].X, 4);
        Assert.Equal(8.0, result.Points[0].Y, 4);
    }

    [Fact]
    public void UpdateDataSetAxes_WithValidRequest_RebuildsDataSet()
    {
        // sprawdzamy czy zmiana osi przebudowuje zbiór
        // Arrange
        var sut = CreateSut();
        var request = new DataSetRequestDto
        {
            X = 1,
            Y = 2,
            Data = new List<List<double>>
            {
                new() { 100.0, 1.5, 9.5 },
                new() { 200.0, 2.5, 8.5 }
            }
        };

        // Act
        var result = sut.UpdateDataSetAxes(request);

        // Assert
        Assert.Equal(2, result.Points.Count);
        Assert.Equal(1.5, result.Points[0].X, 4);
        Assert.Equal(9.5, result.Points[0].Y, 4);
        Assert.Equal(2.5, result.Points[1].X, 4);
        Assert.Equal(8.5, result.Points[1].Y, 4);
    }

    /// <summary>
    /// Tests for AddPoint
    /// Testy metody AddPoint
    /// </summary>
    [Fact]
    public void AddPoint_WithValidDto_AddsMappedPoint()
    {
        // sprawdzamy czy punkt jest dodawany po mapowaniu
        // Arrange
        var sut = CreateSut();
        var dto = new DataPointDto { X = 2.1, Y = 3.7 };
        var mappedPoint = new DataPoint(2.1, 3.7);

        _mapper.Map<DataPoint>(dto).Returns(mappedPoint);
        _mapper.Map<IEnumerable<DataPoint>>(Arg.Any<IEnumerable<DataPoint>>())
            .Returns(call => call.Arg<IEnumerable<DataPoint>>());

        // Act
        sut.AddPoint(dto);
        var points = sut.GetPoints().ToList();

        // Assert
        Assert.Single(points);
        Assert.Equal(2.1, points[0].X, 4);
        Assert.Equal(3.7, points[0].Y, 4);
        _mapper.Received(1).Map<DataPoint>(dto);
    }

    /// <summary>
    /// Tests for UpdatePoint
    /// Testy metody UpdatePoint
    /// </summary>
    [Fact]
    public void UpdatePoint_WithValidIndex_UpdatesCoordinatesAndResetsClusterId()
    {
        // sprawdzamy czy punkt zmienia współrzędne i resetuje ClusterId
        // Arrange
        var sut = CreateSut();
        var request = new DataSetRequestDto
        {
            X = 0,
            Y = 1,
            Data = new List<List<double>>
            {
                new() { 1.0, 2.0 }
            }
        };

        var dataSet = sut.CreateDataSet(request);
        dataSet.Points[0].ClusterId = 5;

        _mapper.Map<IEnumerable<DataPoint>>(Arg.Any<IEnumerable<DataPoint>>())
            .Returns(call => call.Arg<IEnumerable<DataPoint>>());

        // Act
        sut.UpdatePoint(0, 21.37, 69.67);
        var point = sut.GetPoints().First();

        // Assert
        Assert.Equal(21.37, point.X, 4);
        Assert.Equal(69.67, point.Y, 4);
        Assert.Equal(-1, point.ClusterId);
    }

    [Fact]
    public void UpdatePoint_WithNegativeIndex_ThrowsException()
    {
        // sprawdzamy czy ujemny indeks rzuca wyjątek
        // Arrange
        var sut = CreateSut();

        // Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() => sut.UpdatePoint(-1, 1.0, 2.0));
    }

    [Fact]
    public void UpdatePoint_WithIndexOutOfRange_ThrowsException()
    {
        // sprawdzamy czy zbyt duży indeks rzuca wyjątek
        // Arrange
        var sut = CreateSut();
        var request = new DataSetRequestDto
        {
            X = 0,
            Y = 1,
            Data = new List<List<double>>
            {
                new() { 1.0, 2.0 }
            }
        };

        sut.CreateDataSet(request);

        // Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() => sut.UpdatePoint(5, 1.0, 2.0));
    }

    /// <summary>
    /// Tests for RemovePoint
    /// Testy metody RemovePoint
    /// </summary>
    [Fact]
    public void RemovePoint_WithValidIndex_RemovesPoint()
    {
        // sprawdzamy czy punkt jest usuwany dla poprawnego indeksu
        // Arrange
        var sut = CreateSut();
        var request = new DataSetRequestDto
        {
            X = 0,
            Y = 1,
            Data = new List<List<double>>
            {
                new() { 1.0, 2.0 },
                new() { 3.0, 4.0 }
            }
        };

        sut.CreateDataSet(request);

        _mapper.Map<IEnumerable<DataPoint>>(Arg.Any<IEnumerable<DataPoint>>())
            .Returns(call => call.Arg<IEnumerable<DataPoint>>());

        // Act
        sut.RemovePoint(0);
        var points = sut.GetPoints().ToList();

        // Assert
        Assert.Single(points);
        Assert.Equal(3.0, points[0].X, 4);
        Assert.Equal(4.0, points[0].Y, 4);
    }

    [Fact]
    public void RemovePoint_WithInvalidIndex_DoesNothing()
    {
        // sprawdzamy czy błędny indeks nic nie zmienia
        // Arrange
        var sut = CreateSut();
        var request = new DataSetRequestDto
        {
            X = 0,
            Y = 1,
            Data = new List<List<double>>
            {
                new() { 1.0, 2.0 }
            }
        };

        sut.CreateDataSet(request);

        _mapper.Map<IEnumerable<DataPoint>>(Arg.Any<IEnumerable<DataPoint>>())
            .Returns(call => call.Arg<IEnumerable<DataPoint>>());

        // Act
        sut.RemovePoint(10);
        var points = sut.GetPoints().ToList();

        // Assert
        Assert.Single(points);
        Assert.Equal(1.0, points[0].X, 4);
        Assert.Equal(2.0, points[0].Y, 4);
    }

    /// <summary>
    /// Tests for GetPoint / GetPoints
    /// Testy metod GetPoint / GetPoints
    /// </summary>
    [Fact]
    public void GetPoint_WithValidIndex_ReturnsMappedPoint()
    {
        // sprawdzamy czy pojedynczy punkt jest zwracany przez mapper
        // Arrange
        var sut = CreateSut();
        var request = new DataSetRequestDto
        {
            X = 0,
            Y = 1,
            Data = new List<List<double>>
            {
                new() { 2.1, 3.7 }
            }
        };

        sut.CreateDataSet(request);

        _mapper.Map<DataPoint>(Arg.Any<DataPoint>())
            .Returns(call =>
            {
                var p = call.Arg<DataPoint>();
                return new DataPoint(p.X, p.Y) { ClusterId = p.ClusterId };
            });

        // Act
        var result = sut.GetPoint(0);

        // Assert
        Assert.Equal(2.1, result.X, 4);
        Assert.Equal(3.7, result.Y, 4);
        _mapper.Received(1).Map<DataPoint>(Arg.Any<DataPoint>());
    }

    [Fact]
    public void GetPoint_WithInvalidIndex_ThrowsException()
    {
        // sprawdzamy czy brak punktu rzuca wyjątek
        // Arrange
        var sut = CreateSut();

        // Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() => sut.GetPoint(0));
    }

    [Fact]
    public void GetPoints_ReturnsMappedCollection()
    {
        // sprawdzamy czy cała kolekcja jest mapowana i zwracana
        // Arrange
        var sut = CreateSut();
        var request = new DataSetRequestDto
        {
            X = 0,
            Y = 1,
            Data = new List<List<double>>
            {
                new() { 1.0, 2.0 },
                new() { 3.0, 4.0 }
            }
        };

        sut.CreateDataSet(request);

        _mapper.Map<IEnumerable<DataPoint>>(Arg.Any<IEnumerable<DataPoint>>())
            .Returns(call =>
            {
                var points = call.Arg<IEnumerable<DataPoint>>();
                return points.Select(p => new DataPoint(p.X, p.Y) { ClusterId = p.ClusterId }).ToList();
            });

        // Act
        var result = sut.GetPoints().ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(1.0, result[0].X, 4);
        Assert.Equal(2.0, result[0].Y, 4);
        Assert.Equal(3.0, result[1].X, 4);
        Assert.Equal(4.0, result[1].Y, 4);
        _mapper.Received(1).Map<IEnumerable<DataPoint>>(Arg.Any<IEnumerable<DataPoint>>());
    }

    /// <summary>
    /// Tests for ResetData
    /// Testy metody ResetData
    /// </summary>
    [Fact]
    public void ResetData_ClearsAllPoints()
    {
        // sprawdzamy czy reset usuwa wszystkie punkty
        // Arrange
        var sut = CreateSut();
        var request = new DataSetRequestDto
        {
            X = 0,
            Y = 1,
            Data = new List<List<double>>
            {
                new() { 1.0, 2.0 },
                new() { 3.0, 4.0 }
            }
        };

        sut.CreateDataSet(request);

        // Act
        sut.ResetData();

        // Assert
        Assert.Empty(sut.GetPoints());
    }
}