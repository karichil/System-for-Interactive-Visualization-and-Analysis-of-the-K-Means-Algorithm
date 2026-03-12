using KMeansProject.DTO;
using KMeansProject.Services;
using NSubstitute;

namespace KMeans.NewTests.ServicesTests;

public class FileManagerService_Tests
{
    private FileManagerService CreateSut() => new();
    
    /// <summary>
    /// Tests for LoadCsvToStringList
    /// Testy metody LoadCsvToStringList
    /// </summary>
    [Fact]
    public void LoadCsv_WithWrongPath_ThrowsException()
    {
        // Arrange
        var sut = CreateSut();
        
        // Act & Assert
        Assert.Throws<FileNotFoundException>(() => sut.LoadCsvToStringList("/this/path/is/wrong.csv"));
    }
    [Fact]
    public void LoadCsv_WithWrongFileExtension_ThrowsException()
    {
        // Arrange
        var sut = CreateSut();
        
        var tmp = Path.GetTempFileName();
        var txtPath = Path.ChangeExtension(tmp, "txt");
        File.Move(tmp, txtPath);

        // Act & Assert
        try
        {
            Assert.Throws<InvalidDataException>(() => sut.LoadCsvToStringList(txtPath));
        }
        finally 
        {
            File.Delete(tmp);
        }
    }
    [Fact]
    public void LoadCsv_WithValidFile_ReturnsAllLines()
    {
        // Arrange
        var sut = CreateSut();
        var tmp = Path.ChangeExtension(Path.GetTempFileName(), "csv");
        File.WriteAllLines(
            tmp,
            new[] { "krzysztof,gonciarz,papiez,polak", "2.1,3.7,6.7,6.9", "9.6,7.6,7.3,1.2" }
        );
        
        // Act & Assert
        try
        {
            var lines = sut.LoadCsvToStringList(tmp);
            Assert.Equal(3, lines.Count);
        }
        finally
        {
            File.Delete(tmp);
        }
    }
    
    /// <summary>
    /// Tests for PreprocessCsvData
    /// Testy metody PreprocessCsvData
    /// </summary>
    [Fact]
    public void PreprocessCsvData_ParsesHeaders_Correctly()
    {
        // Arrange
        var sut = CreateSut();
        var csv = new List<string> { "politechnika,bialostocka", "1.0,2.0" };
        
        // Act
        var result = sut.PreprocessCsvData(csv);
        
        // Assert
        Assert.Equal(new[] { "politechnika", "bialostocka" }, result.Headers);
    }
    [Fact]
    public void PreprocessCsvData_ParsesValues_Correctly()
    {
        // Arrange
        var sut = CreateSut();
        var csv = new List<string> { "najlepsza,jest", "2.1,3.7", "6.9,4.2" };
        
        // Act
        var result = sut.PreprocessCsvData(csv);
        
        // Assert
        Assert.Equal(2, result.ProcessedData.Count);
        Assert.Equal(2.1, result.ProcessedData[0][0], 4);
        Assert.Equal(3.7, result.ProcessedData[0][1], 4);
        Assert.Equal(6.9, result.ProcessedData[1][0], 4);
        Assert.Equal(4.2, result.ProcessedData[1][1], 4);
    }
    [Fact]
    public void PreprocessCsvData_GivenWrongColumns_ThrowsException()
    {
        // Arrange
        var sut = CreateSut();
        var csv = new List<string> { "politechnika,bialostocka,pb", "1.0,2.0" };
        
        // Act & Assert
        Assert.Throws<InvalidDataException>(() => sut.PreprocessCsvData(csv));
    }
    [Fact]
    public void PreprocessCsvData_GivenNonNumericValues_ThrowsInvalidDataException()
    {
        // Arrange
        var sut = CreateSut();
        var csv = new List<string> { "p,b", "1.0,abc" };
            
        // Act & Assert
        Assert.Throws<InvalidDataException>(() => sut.PreprocessCsvData(csv));
    }
    [Fact]
    public void PreprocessCsvData_GivenSemicolonDelimiter_InterpretsItCorrectly()
    {
        // Arrange
        var sut = CreateSut();
        var csv = new List<string> { "p;b", "2.1;3.7" };

        // Act
        var result = sut.PreprocessCsvData(csv);
        
        // Assert
        Assert.Equal(2.1, result.ProcessedData[0][0], 4);
        Assert.Equal(3.7, result.ProcessedData[0][1], 4);
    }
    [Fact]
    public void PreprocessCsvData_GivenBlanksLines_SkipsThemCorrectly()
    {
        // Arrange
        var sut = CreateSut();
        var csv = new List<string> { "p,b", "2.1,3.7", "", "6.9,6.7" };
        
        // Act
        var result = sut.PreprocessCsvData(csv);
        
        // Assert
        Assert.Equal(2.1d, result.ProcessedData[0][0], 4);
        Assert.Equal(3.7d, result.ProcessedData[0][1], 4);
        Assert.Equal(6.9d, result.ProcessedData[1][0], 4);
        Assert.Equal(6.7d, result.ProcessedData[1][1], 4);
    }
    
    /// <summary>
    /// Mock tests
    /// </summary>
    [Fact]
    public void MockedFileManagerService_ReturnsConfiguredResult()
    {
        // Arrange
        var mock = Substitute.For<IFileManagerService>();
        var result = new FileProcessResultDto()
        {
            Headers = new List<string> { "politechnika", "bialostocka" },
            ProcessedData = new List<List<double>> { new() { 21.37, 69.67 } }
        };
        
        mock.PreprocessCsvData(Arg.Any<List<string>>()).Returns(result);
        
        // Act
        var realResult = mock.PreprocessCsvData(new List<string>());
        
        // Assert
        Assert.Equal(result, realResult);
        mock.Received(1).PreprocessCsvData(Arg.Any<List<string>>());
    }
}