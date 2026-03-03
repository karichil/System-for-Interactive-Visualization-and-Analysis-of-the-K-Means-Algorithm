using KMeansProject.Services;
using Microsoft.AspNetCore.Http; 
using Moq;
using Xunit;

namespace KMeansProject.Tests
{
    public class FileManagerServiceTests
    {
        private readonly FileManagerService _service;

        public FileManagerServiceTests()
        {
            _service = new FileManagerService();
        }

        [Fact]
        public void LoadCsvToStringList_WrongExtension_ShouldThrowException()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("data.txt");
            fileMock.Setup(f => f.Length).Returns(100);
            
            fileMock.Setup(f => f.ContentType).Returns("text/plain"); 

            // Act & Assert
            var ex = Assert.Throws<InvalidDataException>(() => _service.LoadCsvToStringList(fileMock.Object));
            Assert.Contains("Nieprawidłowy format pliku", ex.Message);
        }

        [Fact]
        public void PreprocessCsvData_ValidData_ShouldParseCorrectly()
        {
            // Arrange
            var csvLines = new List<string>
            {
                "X;Y;Z",       
                "1.5;2.5;3.0", 
                "4.0;5.0;6.0"  
            };

            // Act
            var result = _service.PreprocessCsvData(csvLines);

            // Assert
            Assert.Equal(3, result.Headers.Count);
            Assert.Equal(2, result.ProcessedData.Count); 
            
            Assert.Equal(1.5, result.ProcessedData[0][0]); 
            Assert.Equal(2.5, result.ProcessedData[0][1]);
        }

        [Fact]
        public void PreprocessCsvData_NonNumericValue_ShouldThrowException()
        {
            // Arrange
            var csvLines = new List<string>
            {
                "X;Y",
                "1.0;UPS_TEKST"                            
            };

            // Act & Assert
            var ex = Assert.Throws<InvalidDataException>(() => _service.PreprocessCsvData(csvLines));
            Assert.Contains("nie jest liczbą", ex.Message);
        }

        [Fact]
        public void PreprocessCsvData_InconsistentColumns_ShouldThrowException()
        {
            // Arrange
            var csvLines = new List<string>
            {
                "X;Y",      
                "1.0;2.0",  
                "1.0"      
            };

            // Act & Assert
            var ex = Assert.Throws<InvalidDataException>(() => _service.PreprocessCsvData(csvLines));
            Assert.Contains("Niespójna liczba kolumn", ex.Message);
        }

        [Fact]
        public void PreprocessCsvData_EmptyData_ShouldThrowException()
        {
            // Arrange
            var csvLines = new List<string>
            {
                "X;Y"
            };

            // Act & Assert
            var ex = Assert.Throws<InvalidDataException>(() => _service.PreprocessCsvData(csvLines));
            Assert.Contains("nie zawiera danych", ex.Message);
        }
        
        [Fact]
        public void PreprocessCsvData_ShouldHandleEmptyLinesGracefully()
        {
            // Arrange
            var csvLines = new List<string>
            {
                "X;Y",
                "1.0;2.0",
                "",          
                "  ",        
                "3.0;4.0"
            };

            // Act
            var result = _service.PreprocessCsvData(csvLines);

            // Assert
            Assert.Equal(2, result.ProcessedData.Count); 
            Assert.Equal(3.0, result.ProcessedData[1][0]);
        }
    }
}