using AutoMapper;
using KMeans.NewTests.Helpers;
using KMeansProject.Controllers;
using KMeansProject.DTO;
using KMeansProject.Models;
using KMeansProject.Services;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;

namespace KMeans.NewTests.ServicesTests;

public class CentroidManagerService_Tests
{
    private readonly ICentroidManagerService _svc = Substitute.For<ICentroidManagerService>();
    private readonly IMapper _mapper = MapperFactory.CreateMapper();
    private CentroidManagerController CreateSut() => new(_svc, _mapper);

    private static DataSetDto NonEmptyDataSet() => new()
    {
        Points = new List<DataPointDto> { new() { X=1, Y=2 }, new() { X=3, Y=4 } }
    };

    
    [Fact]
    public void Init_PassesCorrectModeToService()
    {
        // Arrange
        _svc.GetCentroids().Returns(new List<DataPoint> { new(0,0,0) });

        // Act
        CreateSut().Initialization(CentroidManager.CentroidMode.KMeansPlusPlus, 5, NonEmptyDataSet());
        
        // Assert
        _svc.Received(1).Initialization(
            CentroidManager.CentroidMode.KMeansPlusPlus,
            5,
            Arg.Any<DataSet>());
    }
    [Fact]
    public void Init_ResponseBody_ContainsCentroidsReturnedByService()
    {
        var serviceCentroids = new List<DataPoint> { new(1.5, 2.5, 0), new(3.5, 4.5, 1) };
        _svc.GetCentroids().Returns(serviceCentroids);
 
        var result = CreateSut().Initialization(
            CentroidManager.CentroidMode.Random,
            2,
            NonEmptyDataSet()) as OkObjectResult;
        var body = result!.Value as List<DataPointDto>;
 
        Assert.Equal(2, body!.Count);
        Assert.Equal(1.5, body[0].X);
        Assert.Equal(4.5, body[1].Y);
    }

}