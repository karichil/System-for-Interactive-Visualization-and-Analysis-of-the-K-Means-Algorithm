using System.Text.Json.Serialization;
using KMeansProject.Controllers;
using KMeansProject.Hubs;
using KMeansProject.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:3000") 
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()); 
});

builder.Services.AddOpenApi();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSignalR();
builder.Services.AddSingleton<IDataSetService,  DataSetService>();
builder.Services.AddSingleton<ICentroidManagerService, CentroidManagerService>();
builder.Services.AddScoped<IClusteringResultsService, ClusteringResultsService>();
builder.Services.AddSingleton<IKMeansAlgorithmService, KMeansAlgorithmService>();
builder.Services.AddScoped<IFileManagerService, FileManagerService>();
builder.Services.AddScoped<MetricFactory>();

builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies(), ServiceLifetime.Singleton);

var app = builder.Build();


app.UseCors("AllowFrontend");
app.MapHub<KMeansHub>("/kmeansHub");
app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();
