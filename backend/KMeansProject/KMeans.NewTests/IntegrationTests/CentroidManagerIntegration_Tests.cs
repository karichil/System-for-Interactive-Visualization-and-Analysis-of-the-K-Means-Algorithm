using System.Net;
using KMeansProject.Models;
using NSubstitute;

namespace KMeans.NewTests.IntegrationTests;

public class CentroidManagerIntegration_Tests : IntegrationTestBase
{
    public CentroidManagerIntegration_Tests(KMeansWebFactory factory) : base(factory) { }

    [Fact]
    public async Task Init_WhenServiceThrowsArgumentException_Returns400()
    {
        CentroidSvc
            .When(s => s.Initialization(
                Arg.Any<CentroidManager.CentroidMode>(),
                Arg.Any<int>(),
                Arg.Any<DataSet>()))
            .Do(_ => throw new ArgumentException());

        var response = await Client.PostAsync(
            "/api/CentroidManager/init?mode=Random&k=0",
            Json(NonEmptyDataSetDto()));
        
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}