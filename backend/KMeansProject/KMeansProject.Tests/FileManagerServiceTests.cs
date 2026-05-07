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
        public void LoadCsvToStringList_IFormFile_NullFile_ReturnsNull()
        {
            // Arrange
            IFormFile nullFile = null;

            // Act
            var result = _service.LoadCsvToStringList(nullFile);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public void LoadCsvToStringList_IFormFile_LengthZero_ReturnsNull()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.Length).Returns(0);

            // Act
            var result = _service.LoadCsvToStringList(fileMock.Object);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public void LoadCsvToStringList_IFormFile_ValidExcelContentType_AcceptsAndReads()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            var content = "X;Y\n1.0;2.0";
            var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));
            
            fileMock.Setup(f => f.FileName).Returns("dane.csv");
            fileMock.Setup(f => f.Length).Returns(stream.Length);
            fileMock.Setup(f => f.ContentType).Returns("application/vnd.ms-excel");
            fileMock.Setup(f => f.OpenReadStream()).Returns(stream);

            // Act
            var result = _service.LoadCsvToStringList(fileMock.Object);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.Equal("X;Y", result[0]);
        }

        [Fact]
        public void PreprocessCsvData_WithOnlyHeaders_ThrowsInvalidDataException()
        {
            // Arrange
            var csv = new List<string> { "X;Y" };

            // Act & Assert
            Assert.Throws<InvalidDataException>(() => _service.PreprocessCsvData(csv));
        }

        [Fact]
        public void LoadCsvToStringList_StringPath_EmptyFile_ThrowsInvalidDataException()
        {
            // Arrange
            var tmp = Path.ChangeExtension(Path.GetTempFileName(), "csv");
            File.WriteAllText(tmp, "");

            // Act & Assert
            try
            {
                Assert.Throws<InvalidDataException>(() => _service.LoadCsvToStringList(tmp));
            }
            finally
            {
                File.Delete(tmp);
            }
        }
    }
}