using KMeansProject.DTO;
using KMeansProject.Services;

namespace KMeansProject.Tests
{
    public class DataSetServiceTests
    {
        private readonly DataSetService _service;

        public DataSetServiceTests()
        {
            var mapper = TestMapperFactory.Create();
            _service = new DataSetService(mapper, new CentroidManagerService(mapper));
        }

        [Fact]
        public void CreateDataSet_ShouldMapCorrectColumns_WhenIndicesAreProvided()
        {
            // Arrange
            var rawData = new List<List<double>>
            {
                new List<double> { 10.0, 999.0, 20.0 },
                new List<double> { 30.0, 888.0, 40.0 }
            };

            var requestDto = new DataSetRequestDto
            {
                Data = rawData,
                X = 0,
                Y = 2
            };

            // Act
            var result = _service.CreateDataSet(requestDto);

            // Assert
            Assert.Equal(2, result.Points.Count);
            Assert.Equal(10.0, result.Points[0].X);
            Assert.Equal(20.0, result.Points[0].Y);
            Assert.Equal(30.0, result.Points[1].X);
            Assert.Equal(40.0, result.Points[1].Y);
        }

        [Fact]
        public void UpdatePoint_ValidIndex_ShouldUpdateCoordinatesAndResetCluster()
        {
            // Arrange
            var requestDto = new DataSetRequestDto
            {
                Data = new List<List<double>> { new List<double> { 1, 1 } },
                X = 0,
                Y = 1
            };
            _service.CreateDataSet(requestDto);

            // Act
            _service.UpdatePoint(0, 5.0, 5.0);
            var updatedPoint = _service.GetPoint(0);

            // Assert
            Assert.NotNull(updatedPoint);
            Assert.Equal(5.0, updatedPoint.X);
            Assert.Equal(5.0, updatedPoint.Y);
            Assert.Equal(-1, updatedPoint.ClusterId);
        }

        [Fact]
        public void UpdatePoint_InvalidIndex_ShouldThrowException()
        {
            // Arrange
            _service.ResetData();

            // Act & Assert
            Assert.Throws<ArgumentOutOfRangeException>(() => _service.UpdatePoint(0, 5, 5));
        }

        [Fact]
        public void AddPoint_ShouldMapDtoAndAddToCollection()
        {
            // Arrange
            var dto = new DataPointDto { X = 1, Y = 2 };

            // Act
            _service.AddPoint(dto);

            // Assert
            var point = Assert.Single(_service.GetPoints());
            Assert.Equal(1, point.X);
            Assert.Equal(2, point.Y);
        }

        [Fact]
        public void RemovePoint_ShouldDecreaseCount()
        {
            // Arrange
            var requestDto = new DataSetRequestDto
            {
                Data = new List<List<double>> { new List<double> { 1, 1 }, new List<double> { 2, 2 } },
                X = 0,
                Y = 1
            };
            _service.CreateDataSet(requestDto);

            // Act
            _service.RemovePoint(0);

            // Assert
            var points = _service.GetPoints().ToList();
            Assert.Single(points);
            Assert.Equal(2.0, points[0].X);
        }
    }
}
