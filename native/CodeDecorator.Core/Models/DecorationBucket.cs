namespace CodeDecorator.Core.Models;

public sealed class DecorationBucket
{
    public string RuleId { get; set; } = string.Empty;
    public string RuleDescription { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? BackgroundColor { get; set; }
    public string? BorderColor { get; set; }
    public string? TextDecoration { get; set; }
    public List<DecorationRange> Ranges { get; set; } = [];
}
