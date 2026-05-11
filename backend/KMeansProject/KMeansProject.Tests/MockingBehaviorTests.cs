using KMeansProject.DTO;
using KMeansProject.Models;
using KMeansProject.Services;
using Microsoft.AspNetCore.Http;
using Moq;

namespace KMeansProject.Tests;

[Trait("Category", "Mocking")]
public class MockingBehaviorTests
{
    [Fact]
    public void DataSetService_AddPoint_ShouldCallMapperOnce()
    {
        // Arrange
        var mapperMock = new Mock<AutoMapper.IMapper>();
        var centroidManagerMock = new Mock<ICentroidManagerService>();
        var service = new DataSetService(mapperMock.Object, centroidManagerMock.Object);
        var dto = new DataPointDto { X = 1, Y = 2 };
        var model = new DataPoint(1, 2);

        mapperMock.Setup(m => m.Map<DataPoint>(dto)).Returns(model);
        mapperMock.Setup(m => m.Map<IEnumerable<DataPoint>>(It.IsAny<List<DataPoint>>()))
            .Returns((List<DataPoint> source) => source);

        // Act
        service.AddPoint(dto);

        // Assert
        Assert.Single(service.GetPoints());
        mapperMock.Verify(m => m.Map<DataPoint>(dto), Times.Once);
    }

    [Fact]
    public void FileManagerService_LoadCsvToStringList_ShouldUseMockedFileMetadata()
    {
        // Arrange
        var service = new FileManagerService();
        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns("data.txt");
        fileMock.Setup(f => f.Length).Returns(100);
        fileMock.Setup(f => f.ContentType).Returns("text/plain");

        // Act & Assert
        var ex = Assert.Throws<InvalidDataException>(() => service.LoadCsvToStringList(fileMock.Object));
        Assert.Contains("format pliku", ex.Message);
    }
    [Fact]
    public void DataSetService_GetPoints_ShouldReturnMappedCollection()
    {
        // Arrange
        var mapperMock = new Mock<AutoMapper.IMapper>();
        var centroidManagerMock = new Mock<ICentroidManagerService>();

        var service = new DataSetService(mapperMock.Object, centroidManagerMock.Object);

        var points = new List<DataPoint>
        {
            new DataPoint(1, 2),
            new DataPoint(3, 4)
        };

        mapperMock.Setup(m => m.Map<IEnumerable<DataPoint>>(It.IsAny<List<DataPoint>>()))
            .Returns(points);

        service.AddPoint(new DataPointDto { X = 1, Y = 2 });
        service.AddPoint(new DataPointDto { X = 3, Y = 4 });

        // Act
        var result = service.GetPoints();

        // Assert
        Assert.Equal(2, result.Count());
        mapperMock.Verify(
            m => m.Map<IEnumerable<DataPoint>>(It.IsAny<List<DataPoint>>()),
            Times.AtLeastOnce);
    }
}
