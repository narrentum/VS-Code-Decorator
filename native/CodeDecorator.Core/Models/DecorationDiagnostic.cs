namespace CodeDecorator.Core.Models;

public sealed class DecorationDiagnostic
{
    public string RuleDescription { get; set; } = string.Empty;
    public string Severity { get; set; } = "info";
    public string Message { get; set; } = string.Empty;
}
