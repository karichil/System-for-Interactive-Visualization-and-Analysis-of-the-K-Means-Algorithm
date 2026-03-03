using AutoMapper;
using KMeansProject.DTO;
using KMeansProject.Models;

namespace KMeansProject;

public class KMeansMappingProfile : Profile
{
    public KMeansMappingProfile()
    {
        CreateMap<DataPoint, DataPointDto>().ReverseMap();
        
        CreateMap<CentroidManager, CentroidManagerDto>().ReverseMap();

        CreateMap<DataSet, DataSetDto>().ReverseMap();
    }
}