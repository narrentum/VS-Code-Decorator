namespace CodeDecorator.Core.Models;

public sealed class DecorationRequest
{
    public string DocumentText { get; set; } = string.Empty;
    public string LanguageId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public int MaxFileLength { get; set; } = 500_000;
    public int RegexTimeoutMs { get; set; } = 50;
    public int Version { get; set; }
    public List<DecorationRule> Rules { get; set; } = [];
}
