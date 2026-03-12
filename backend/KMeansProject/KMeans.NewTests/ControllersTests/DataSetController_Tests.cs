using AutoMapper;
using KMeans.NewTests.Helpers;
using KMeansProject.Controllers;
using KMeansProject.DTO;
using KMeansProject.Models;
using KMeansProject.Services;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace KMeans.NewTests.ControllersTests;

public class DataSetController_Tests
{
    private readonly IDataSetService _service = Substitute.For<IDataSetService>();
    private readonly IMapper _mapper = MapperFactory.CreateMapper();
    private DataSetController CreateSut() => new(_service, _mapper);
    private static DataSetRequestDto MockRequest(int rows) => new()
    {
        Data = Enumerable.Range(0, rows)
            .Select(x => new List<double> { x * 1.0d, x * 2.0d })
            .ToList(),
        X = 0,
        Y = 1
    };
    
    /// <summary>
    ///  SUT - GetPoints
    /// </summary>
    [Fact]
    public void GetPoints_WhenEmpty_Returns_204()
    {
        // Arrange
        _service.GetPoints()
            .Returns(Enumerable.Empty<DataPoint>());
        
        // Act
        var result = CreateSut().GetPoints();
        
        // Assert
        Assert.IsType<NoContentResult>(result.Result);
    }
    [Fact]
    public void GetPoints_WhenNotEmpty_Returns_200()
    {
        // Arrange
        _service.GetPoints()
            .Returns(new List<DataPoint> { new(21, 37)});
        
        // Act
        var result = CreateSut().GetPoints().Result as OkObjectResult;
        
        // Assert
        Assert.NotNull(result);
    }
    [Fact]
    public void GetPoints_WhenServiceThrowsException_Returns_500()
    {
        // Arrange
        _service.GetPoints()
            .Throws(new Exception("xD"));
        
        // Act
        var result = CreateSut().GetPoints().Result as ObjectResult;
        
        // Assert
        Assert.Equal(500, result!.StatusCode);
    }

    /// <summary>
    /// SUT - GetPoint
    /// </summary>
    [Fact]
    public void GetPoint_WithValidId_Returns_200()
    {
        // Arrange
        _service.GetPoint(0)
            .Returns(new DataPoint(1, 2, 3));
        
        // Act
        var result = CreateSut().GetPoint(0).Result as OkObjectResult;
        
        // Assert
        Assert.NotNull(result);
    }
    [Fact]
    public void GetPoint_WithInValidId_Returns_404()
    {
        // Arrange
        _service.GetPoint(Arg.Any<int>())
            .Throws(new ArgumentOutOfRangeException("xD"));
        
        // Act
        var result = CreateSut().GetPoint(2137);
        
        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }
    [Fact]
    public void GetPoint_WhenServiceThrows_Returns_500()
    {
        // Arrange
        _service.GetPoint(Arg.Any<int>())
            .Throws(new Exception("xD"));
        
        // Act
        var result = CreateSut().GetPoint(0).Result as ObjectResult;
        
        // Assert
        Assert.Equal(500, result!.StatusCode);
    }

    /// <summary>
    /// SUT - CreateDataSet
    /// </summary>
    [Fact]
    public void CreateDataSet_ReturnsDataSet_With_200()
    {
        // Arrange
        var dto = MockRequest(2);
        _service
            .CreateDataSet(dto)
            .Returns(
                new DataSet
                {
                    Points = new List<DataPoint> { new(1,2) }
                });
        
        // Act
        var result = CreateSut().CreateDataSet(dto).Result as OkObjectResult;
        
        // Assert
        Assert.NotNull(result);
    }
    [Fact]
    public void CreateDataSet_WhenServiceThrows_Returns_500()
    {
        // Arrange
        _service.CreateDataSet(Arg.Any<DataSetRequestDto>())
            .Throws(new Exception("xD"));
        
        // Act
        var result = CreateSut().CreateDataSet(new DataSetRequestDto()).Result as ObjectResult;
        
        // Assert
        Assert.Equal(500, result!.StatusCode);
    }

    /// <summary>
    /// SUT - UpdateDataSetAxes
    /// </summary>
    [Fact]
    public void UpdateDataSetAxes_Returns_200()
    {
        // Arrange
        _service.UpdateDataSetAxes(Arg.Any<DataSetRequestDto>())
            .Returns(new DataSet { Points = new List<DataPoint> { new(1, 2) } });
        
        // Act
        var result = CreateSut().UpdateDataSetAxes(new DataSetRequestDto()).Result as OkObjectResult;
        
        // Assert
        Assert.NotNull(result);
    }
    [Fact]
    public void UpdateDataSetAxes_WhenServiceThrows_Returns_500()
    {
        // Arrange
        _service.UpdateDataSetAxes(Arg.Any<DataSetRequestDto>())
            .Throws(new Exception("xD"));
        
        // Act
        var result = CreateSut().UpdateDataSetAxes(new DataSetRequestDto()).Result as ObjectResult;
        
        // Assert
        Assert.Equal(500, result!.StatusCode);
    }
    
    /// <summary>
    /// SUT - AddPoint
    /// </summary>
    [Fact]
    public void AddPoint_CallsService_AndReturns_200()
    {
        // Arrange
        _service.GetPoints().Returns(new List<DataPoint> { new(1, 2) });
        var dto = new DataPointDto { X = 1, Y = 2 };
        
        // Act
        var result = CreateSut().AddPoint(dto) as OkObjectResult;
        
        // Assert
        Assert.NotNull(result);
        _service.Received(1).AddPoint(dto);
    }
    [Fact]
    public void AddPoint_WhenServiceThrows_Returns_500()
    {
        // Arrange
        _service.When(s => 
                    s.AddPoint(Arg.Any<DataPointDto>())
                )
                .Do(_ => throw new Exception("xD"));
        
        // Act
        var result = CreateSut().AddPoint(new DataPointDto()) as ObjectResult;
        
        // Assert
        Assert.Equal(500, result!.StatusCode);
    }
    
    /// <summary>
    /// SUT - UpdatePoint
    /// </summary>
    [Fact]
    public void UpdatePoint_WithInvalidId_Returns_404()
    {
        // Arrange
        _service.When(s => 
                s.UpdatePoint(
                    Arg.Any<int>(),
                    Arg.Any<double>(),
                    Arg.Any<double>()))
                .Do(_ => throw new ArgumentOutOfRangeException());
        
        // Act
        var result = CreateSut().UpdatePoint(99, 0, 0);
        
        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }
    [Fact]
    public void UpdatePoint_WhenServiceThrows_Returns_500()
    {
        // Arrange
        _service.When(s => 
                s.UpdatePoint(
                    Arg.Any<int>(),
                    Arg.Any<double>(),
                    Arg.Any<double>()))
                .Do(_ => throw new InvalidOperationException("xD"));
        
        // Act
        var result = CreateSut().UpdatePoint(0, 1, 1) as ObjectResult;
        
        // Assert
        Assert.Equal(500, result!.StatusCode);
    }
    
    /// <summary>
    /// SUT - RemovePoint
    /// </summary>
    /// 
    [Fact]
    public void RemovePoint_WithValidId_CallsServiceAndReturns_204()
    {
        // Arrange & Act
        var result = CreateSut().RemovePoint(0);
        
        // Assert
        Assert.IsType<NoContentResult>(result);
        _service.Received(1).RemovePoint(0);
    }
 
    [Fact]
    public void RemovePoint_WhenServiceThrows_Returns_500()
    {
        // Arrange
        _service.When(s => s.RemovePoint(Arg.Any<int>())).Do(_ => throw new Exception("xd"));
        
        // Act
        var result = CreateSut().RemovePoint(0) as ObjectResult;
        
        // Assert
        Assert.Equal(500, result!.StatusCode);
    }
}