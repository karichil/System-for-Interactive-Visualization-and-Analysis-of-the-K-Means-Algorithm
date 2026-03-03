using KMeansProject.Models;
using KMeansProject.Services;
using AutoMapper;
using Microsoft.AspNetCore.SignalR;
using Moq;
using KMeansProject.Hubs;
using Xunit;

namespace KMeansProject.Tests;

public class KMeansAlgorithmServiceTests
{
    private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IHubContext<KMeansHub>> _hubContextMock;
        private readonly Mock<IClientProxy> _clientProxyMock;
        private readonly KMeansAlgorithmService _service;
        private readonly IDistanceMetric _metric;

        public KMeansAlgorithmServiceTests()
        {
            _mapperMock = new Mock<IMapper>();
            _hubContextMock = new Mock<IHubContext<KMeansHub>>();
            _clientProxyMock = new Mock<IClientProxy>();
            
            _hubContextMock.Setup(x => x.Clients.All).Returns(_clientProxyMock.Object);

            _service = new KMeansAlgorithmService(_mapperMock.Object, _hubContextMock.Object);
            
            _metric = new EuclideanMetric();
        }

        private (DataSet, CentroidManager) CreateTestData()
        {
            var dataSet = new DataSet();
            dataSet.Points.Add(new DataPoint(0, 0, -1));
            dataSet.Points.Add(new DataPoint(2, 0, -1));
            
            dataSet.Points.Add(new DataPoint(10, 10, -1));
            dataSet.Points.Add(new DataPoint(10, 12, -1));

            var centroidManager = new CentroidManager();
            centroidManager.Centroids.Add(new DataPoint(1, 1, 0));
            centroidManager.Centroids.Add(new DataPoint(9, 9, 1)); 

            return (dataSet, centroidManager);
        }

        [Fact]
        public void AlgorithmInitialization_ShouldResetStateAndSaveSnapshot()
        {
            var (dataSet, centroidManager) = CreateTestData();
            
            _service.AlgorithmInitialization(dataSet, centroidManager, _metric, 10);
            
            Assert.Equal(0, _service.GetIteration());
            Assert.False(_service.IsAlgorithmFinished());
            
            var currentCentroids = _service.GetCurrentCentroids();
            Assert.Equal(2, currentCentroids.Count);
        }

        [Fact]
        public void StepForward_ShouldAssignPointsToNearestClusters()
        {
            // Arrange
            var (dataSet, centroidManager) = CreateTestData();
            _service.AlgorithmInitialization(dataSet, centroidManager, _metric, 10);

            // Act
            _service.StepForward();
            var points = _service.GetCurrentDataPoints();

            // Assert
            Assert.Equal(0, points[0].ClusterId);
            Assert.Equal(0, points[1].ClusterId);
            
            Assert.Equal(1, points[2].ClusterId);
            Assert.Equal(1, points[3].ClusterId);
        }

        [Fact]
        public void StepForward_ShouldRecalculateCentroidsPosition()
        {
            // Arrange
            var (dataSet, centroidManager) = CreateTestData();
            _service.AlgorithmInitialization(dataSet, centroidManager, _metric, 10);

            // Act
            _service.StepForward();
            var centroids = _service.GetCurrentCentroids();

            // Assert
            Assert.Equal(1, centroids[0].X);
            Assert.Equal(0, centroids[0].Y);
            
            Assert.Equal(10, centroids[1].X);
            Assert.Equal(11, centroids[1].Y);
        }

        [Fact]
        public void StepBackward_ShouldRevertToPreviousState()
        {
            // Arrange
            var (dataSet, centroidManager) = CreateTestData();
            var initialCentroidX = centroidManager.Centroids[0].X;

            _service.AlgorithmInitialization(dataSet, centroidManager, _metric, 10);
            
            _service.StepForward(); 
            var iterationAfterStep = _service.GetIteration();

            // Act
            _service.StepBackward();
            var iterationAfterBack = _service.GetIteration();
            var centroidAfterBack = _service.GetCurrentCentroids();

            // Assert
            Assert.Equal(1, iterationAfterStep);
            Assert.Equal(0, iterationAfterBack);
            Assert.Equal(initialCentroidX, centroidAfterBack[0].X);
        }

        [Fact]
        public void FinishResult_ShouldRunUntilConvergence()
        {
            // Arrange
            var (dataSet, centroidManager) = CreateTestData();
            _service.AlgorithmInitialization(dataSet, centroidManager, _metric, 100);

            // Act
            var result = _service.FinishResult(100);

            // Assert
            Assert.True(_service.IsAlgorithmFinished());
            Assert.True(_service.GetIteration() > 0);
            
            var finalCentroids = _service.GetCurrentCentroids();
            Assert.Equal(1, finalCentroids[0].X);
            Assert.Equal(0, finalCentroids[0].Y);
        }

        [Fact]
        public void ClearToStartAgain_ShouldResetEverything()
        {
            // Arrange
            var (dataSet, centroidManager) = CreateTestData();
            _service.AlgorithmInitialization(dataSet, centroidManager, _metric, 10);
            _service.StepForward();

            // Act
            _service.ClearToStartAgain();

            // Assert
            Assert.Equal(0, _service.GetIteration());
            Assert.Empty(dataSet.Points);
            Assert.Empty(centroidManager.Centroids);
        }

        [Fact]
        public void EmptyCluster_ShouldReassignRandomly_DoesNotThrow()
        {
            // Arrange 
            var dataSet = new DataSet();
            dataSet.Points.Add(new DataPoint(0, 0, -1)); 
            
            var centroidManager = new CentroidManager();
            centroidManager.Centroids.Add(new DataPoint(0.1, 0.1, 0));
            centroidManager.Centroids.Add(new DataPoint(100, 100, 1));

            _service.AlgorithmInitialization(dataSet, centroidManager, _metric, 10);

            // Act  
            var exception = Record.Exception(() => _service.StepForward());

            // Assert
            Assert.Null(exception);
            
            var centroids = _service.GetCurrentCentroids();

            Assert.Equal(0, centroids[1].X);
            Assert.Equal(0, centroids[1].Y);
        }
}