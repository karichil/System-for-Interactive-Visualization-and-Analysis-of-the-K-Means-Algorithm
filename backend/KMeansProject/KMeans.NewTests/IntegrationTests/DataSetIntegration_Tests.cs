using System.Net;
using System.Net.Http.Json;
using KMeansProject.DTO;
using KMeansProject.Models;
using NSubstitute;

namespace KMeans.NewTests.IntegrationTests;

public class DataSetIntegration_Tests : IntegrationTestBase
{
    public DataSetIntegration_Tests(KMeansWebFactory factory) : base(factory) { }
    
    [Fact]
    public async Task GetPoints_WhenNotEmpty_Returns200WithMappedDtos()
    {
        // Arrange
        DataSetSvc.GetPoints().Returns(new List<DataPoint>
        {
            new(10.0, 20.0, 0),
            new(30.0, 40.0, 1)
        });
 
        // Act
        var response = await Client.GetAsync("/api/DataSet");
        var body     = await response.Content.ReadFromJsonAsync<List<DataPointDto>>();
 
        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(2, body!.Count);
        Assert.Equal(10.0, body[0].X);
        Assert.Equal(40.0, body[1].Y);
    }
    [Fact]
    public async Task GetPoint_ValidId_Returns200WithCorrectPoint()
    {
        // Arrange
        DataSetSvc.GetPoint(3).Returns(new DataPoint(7.7, 8.8, 3));
 
        // Act
        var response = await Client.GetAsync("/api/DataSet/3");
        var body     = await response.Content.ReadFromJsonAsync<DataPointDto>();
 
        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(7.7, body!.X);
        Assert.Equal(8.8, body.Y);
    }

}