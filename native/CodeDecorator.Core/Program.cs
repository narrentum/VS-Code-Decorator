using System.Text.Json;
using CodeDecorator.Core.Models;
using CodeDecorator.Core.Services;

var jsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented = false
};

try
{
    using var reader = new StreamReader(Console.OpenStandardInput());
    var input = await reader.ReadToEndAsync();
    var request = JsonSerializer.Deserialize<DecorationRequest>(input, jsonOptions);
    if (request is null)
    {
        await WriteResponse(new DecorationResponse
        {
            Success = false,
            Diagnostics =
            [
                new DecorationDiagnostic
                {
                    Severity = "error",
                    Message = "Request JSON is empty or invalid."
                }
            ]
        });
        return 1;
    }

    var response = new DecorationEngine().Process(request);
    await WriteResponse(response);
    return response.Success ? 0 : 1;
}
catch (Exception ex)
{
    await WriteResponse(new DecorationResponse
    {
        Success = false,
        Diagnostics =
        [
            new DecorationDiagnostic
            {
                Severity = "error",
                Message = ex.Message
            }
        ]
    });
    return 1;
}

async Task WriteResponse(DecorationResponse response)
{
    var output = JsonSerializer.Serialize(response, jsonOptions);
    await Console.Out.WriteAsync(output);
}
