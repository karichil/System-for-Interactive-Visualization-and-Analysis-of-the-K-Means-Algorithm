using AutoMapper;
using KMeansProject.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;

namespace KMeansProject.Tests;

internal static class TestMapperFactory
{
    public static IMapper Create()
    {
        var configuration = new MapperConfiguration(
            cfg => cfg.AddProfile<KMeansMappingProfile>(),
            NullLoggerFactory.Instance);
        return configuration.CreateMapper();
    }
}

internal sealed class NoOpHubContext : IHubContext<KMeansHub>
{
    public IHubClients Clients { get; } = new NoOpHubClients();
    public IGroupManager Groups { get; } = new NoOpGroupManager();
}

internal sealed class NoOpHubClients : IHubClients
{
    private static readonly IClientProxy ClientProxy = new NoOpClientProxy();

    public IClientProxy All => ClientProxy;
    public IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => ClientProxy;
    public IClientProxy Client(string connectionId) => ClientProxy;
    public IClientProxy Clients(IReadOnlyList<string> connectionIds) => ClientProxy;
    public IClientProxy Group(string groupName) => ClientProxy;
    public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => ClientProxy;
    public IClientProxy Groups(IReadOnlyList<string> groupNames) => ClientProxy;
    public IClientProxy User(string userId) => ClientProxy;
    public IClientProxy Users(IReadOnlyList<string> userIds) => ClientProxy;
}

internal sealed class NoOpClientProxy : IClientProxy
{
    public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}

internal sealed class NoOpGroupManager : IGroupManager
{
    public Task AddToGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task RemoveFromGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
