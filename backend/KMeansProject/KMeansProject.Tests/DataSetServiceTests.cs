using AutoMapper;
using KMeansProject.DTO;
using KMeansProject.Models;
using KMeansProject.Services;
using Moq;

namespace KMeansProject.Tests
{
    public class DataSetServiceTests
    {
        private readonly DataSetService _service;
        private readonly Mock<ICentroidManagerService> _centroidManagerMock;
        private readonly Mock<IMapper> _mapperMock;

        public DataSetServiceTests()
        {
            _mapperMock = new Mock<IMapper>();
            _centroidManagerMock = new Mock<ICentroidManagerService>();
            _service = new DataSetService(_mapperMock.Object, _centroidManagerMock.Object);
            
            _mapperMock.Setup(m => m.Map<DataPoint>(It.IsAny<DataPoint>()))
                       .Returns((DataPoint source) => source);
            
            _mapperMock.Setup(m => m.Map<IEnumerable<DataPoint>>(It.IsAny<List<DataPoint>>()))
                       .Returns((List<DataPoint> source) => source);
        }

        [Fact]
        public void UpdatePoint_AlwaysSetsClusterIdToMinusOne()
        {
            // Arrange
            var request = new DataSetRequestDto { X = 0, Y = 1, Data = new List<List<double>> { new List<double> { 1.0, 2.0 } } };
            _service.CreateDataSet(request);
            
            // Act
            _service.UpdatePoint(0, 50.0, 50.0);
            var points = _service.GetPoints().ToList();

            // Assert
            Assert.Equal(-1, points[0].ClusterId);
        }

        [Fact]
        public void RemovePoint_IndexExactlyEqualToCount_DoesNothing()
        {
           
            // Arrange
            var request = new DataSetRequestDto { X = 0, Y = 1, Data = new List<List<double>> { new List<double> { 1.0, 2.0 } } };
            _service.CreateDataSet(request);

            // Act
            var exception = Record.Exception(() => _service.RemovePoint(1)); 
            var points = _service.GetPoints().ToList();

            // Assert
            Assert.Null(exception);
            Assert.Single(points);
        }

        [Fact]
        public void CreateDataSet_ClearsExistingPointsBeforeAdding()
        {
            // Arrange
            var req1 = new DataSetRequestDto { X = 0, Y = 1, Data = new List<List<double>> { new List<double> { 1.0, 2.0 } } };
            var req2 = new DataSetRequestDto { X = 0, Y = 1, Data = new List<List<double>> { new List<double> { 9.0, 9.0 } } };

            // Act
            _service.CreateDataSet(req1);
            var result = _service.CreateDataSet(req2);

            // Assert
            Assert.Single(result.Points);
            Assert.Equal(9.0, result.Points[0].X);
        }

        [Fact]
        public void GetPoint_BoundaryIndex_ThrowsArgumentOutOfRangeException()
        {
            // Arrange
            var request = new DataSetRequestDto { X = 0, Y = 1, Data = new List<List<double>> { new List<double> { 1.0, 2.0 } } };
            _service.CreateDataSet(request);

            // Act & Assert
            Assert.Throws<ArgumentOutOfRangeException>(() => _service.GetPoint(1));
        }

        [Fact]
        public void ResetData_CanBeCalledMultipleTimesWithoutError()
        {
            // Arrange & Act & Assert
            var ex = Record.Exception(() => 
            {
                _service.ResetData();
                _service.ResetData();
            });

            Assert.Null(ex);
        }
    }
}