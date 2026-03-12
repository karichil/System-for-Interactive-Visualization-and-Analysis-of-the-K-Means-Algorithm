using AutoMapper;
using KMeansProject.DTO;
using KMeansProject.Models;

namespace KMeans.NewTests.Helpers;

internal static class MapperFactory
{
    public static IMapper CreateMapper()
    {
        var cfg = new MapperConfiguration(c =>
        {
            c.CreateMap<DataPoint, DataPointDto>().ReverseMap();
            c.CreateMap<CentroidManager, CentroidManager>();
            c.CreateMap<DataSet, DataSetDto>().ReverseMap();
        });
        return cfg.CreateMapper();
    }
}