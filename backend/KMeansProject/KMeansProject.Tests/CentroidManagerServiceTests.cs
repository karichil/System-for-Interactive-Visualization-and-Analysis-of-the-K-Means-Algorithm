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
    
    private DataSet CreateTestData()
    {
        var dataSet = new DataSet();
        dataSet.Points.Add(new DataPoint(0, 0, -1));
        dataSet.Points.Add(new DataPoint(2, 0, -1));
        dataSet.Points.Add(new DataPoint(1, 0, -1));
        dataSet.Points.Add(new DataPoint(2, 3, -1));
            
        dataSet.Points.Add(new DataPoint(10, 10, -1));
        dataSet.Points.Add(new DataPoint(10, 12, -1));
        dataSet.Points.Add(new DataPoint(10, 11, -1));
        dataSet.Points.Add(new DataPoint(12, 13, -1));
        
        return dataSet;
    }

   [Fact]
        public void AddCentroid_ShouldIncreaseCount_AndAssignCorrectId()
        {
            // Arrange
            _service.ResetControidsParameters(); 

            // Act
            _service.AddCentroid(10, 20);
            _service.AddCentroid(30, 40);
            var result = _service.GetCentroids();

            // Assert
            Assert.Equal(2, result.Count);
            
            Assert.Equal(10, result[0].X);
            Assert.Equal(20, result[0].Y);
            Assert.Equal(0, result[0].ClusterId); 
            
            Assert.Equal(30, result[1].X);
            Assert.Equal(1, result[1].ClusterId);
        }

        [Fact]
        public void RemoveCentroid_ShouldDecreaseCount()
        {
            // Arrange
            _service.AddCentroid(1, 1);
            _service.AddCentroid(2, 2);
            _service.AddCentroid(3, 3);

            // Act
            _service.RemoveCentroid(1); 
            var result = _service.GetCentroids();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Equal(3, result[1].X);
        }

        [Fact]
        public void RemoveCentroid_InvalidId_ShouldThrowException()
        {
            // Arrange
            _service.AddCentroid(1, 1);

            // Act & Assert
            Assert.Throws<ArgumentOutOfRangeException>(() => _service.RemoveCentroid(99));
        }
    

        [Fact]
        public void RandomInit_ShouldCreateExactlyKCentroids()
        {
            // Arrange
            var points = CreateTestData();
            int k = 3;

            // Act
            var result = _service.RandomInit(points.Points, k);

            // Assert
            Assert.Equal(k, result.Count);
            Assert.Equal(k, _service.GetCentroids().Count); 
        }

        [Fact]
        public void RandomInit_ShouldClearPreviousCentroids()
        {
            // Arrange
            _service.AddCentroid(999, 999);
            var points = CreateTestData();
            int k = 1;

            // Act
            _service.RandomInit(points.Points, k);

            // Assert
            var result = _service.GetCentroids();
            Assert.Single(result);
            Assert.NotEqual(999, result[0].X);
        }
        

        [Fact]
        public void KMeansPlusPlusInit_ShouldCreateExactlyKCentroids()
        {
            // Arrange
            var points = new List<DataPoint>();
            for(int i=0; i<20; i++) points.Add(newDataPoint(i, i));
            
            int k = 5;

            // Act
            var result = _service.KMeansPlusPlusInit(points, k);

            // Assert
            Assert.Equal(k, result.Count);
            for(int i=0; i<k; i++)
            {
                Assert.Equal(i, result[i].ClusterId);
            }
        }

        [Fact]
        public void KMeansPlusPlusInit_KEqualsPointsCount_ShouldSelectAllPoints()
        {
            // Arrange
            var points = new List<DataPoint>
            {
                newDataPoint(0,0), 
                newDataPoint(10,10), 
                newDataPoint(20,20)
            };
            int k = 3;

            // Act
            var result = _service.KMeansPlusPlusInit(points, k);

            // Assert
            Assert.Equal(3, result.Count);
            Assert.Contains(result, c => c.X == 0 && c.Y == 0);
            Assert.Contains(result, c => c.X == 10 && c.Y == 10);
            Assert.Contains(result, c => c.X == 20 && c.Y == 20);
        }
        
        private DataPoint newDataPoint(double x, double y)
        {
            return new DataPoint(x, y);
        }
    
}