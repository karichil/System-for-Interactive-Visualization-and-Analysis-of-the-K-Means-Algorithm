using KMeansProject.Services;
using Microsoft.AspNetCore.Http;
using System.Text;
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
            var file = CreateFormFile("data.txt", "text/plain", "X;Y");

            // Act & Assert
            var ex = Assert.Throws<InvalidDataException>(() => _service.LoadCsvToStringList(file));
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

        private static IFormFile CreateFormFile(string fileName, string contentType, string content)
        {
            var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
            return new FormFile(stream, 0, stream.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };
        }
    }
}
