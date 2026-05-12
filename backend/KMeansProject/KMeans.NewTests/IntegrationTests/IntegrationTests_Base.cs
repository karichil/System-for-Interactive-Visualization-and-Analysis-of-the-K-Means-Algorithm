using System.Text;
using System.Text.Json;
using KMeansProject.DTO;
using KMeansProject.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.VisualStudio.TestPlatform.TestHost;
using NSubstitute;

namespace KMeans.NewTests.IntegrationTests;

// abstraction
public class KMeansWebFactory : WebApplicationFactory<Program>
{
    public ICentroidManagerService  CentroidSvc  { get; } = Substitute.For<ICentroidManagerService>();
    public IDataSetService          DataSetSvc   { get; } = Substitute.For<IDataSetService>();
    public IKMeansAlgorithmService  AlgorithmSvc { get; } = Substitute.For<IKMeansAlgorithmService>();
    public IClusteringResultsService ClusterSvc  { get; } = Substitute.For<IClusteringResultsService>();
    public IFileManagerService      FileSvc      { get; } = Substitute.For<IFileManagerService>();
 
    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            services.AddSingleton(CentroidSvc);
            services.AddSingleton(DataSetSvc);
            services.AddSingleton(AlgorithmSvc);
            services.AddSingleton(ClusterSvc);
            services.AddSingleton(FileSvc);
        });
    }
}
public abstract class IntegrationTestBase : IClassFixture<KMeansWebFactory>
{
    protected readonly HttpClient Client;
    protected readonly KMeansWebFactory Factory;
 
    protected ICentroidManagerService   CentroidSvc  => Factory.CentroidSvc;
    protected IDataSetService           DataSetSvc   => Factory.DataSetSvc;
    protected IKMeansAlgorithmService   AlgorithmSvc => Factory.AlgorithmSvc;
    protected IClusteringResultsService ClusterSvc   => Factory.ClusterSvc;
    protected IFileManagerService       FileSvc      => Factory.FileSvc;
 
    protected IntegrationTestBase(KMeansWebFactory factory)
    {
        Factory = factory;
        Client  = factory.CreateClient();
    }
 
    protected static StringContent Json<T>(T value) =>
        new(JsonSerializer.Serialize(value), Encoding.UTF8, "application/json");
 
    protected static DataSetDto NonEmptyDataSetDto() => new()
    {
        Points = new List<DataPointDto>
        {
            new() { X = 1, Y = 2 },
            new() { X = 3, Y = 4 }
        }
    };
}