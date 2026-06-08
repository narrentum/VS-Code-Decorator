namespace CodeDecorator.Core.Models;

public sealed class DecorationRule
{
    public string? Kind { get; set; }
    public string? Description { get; set; }
    public bool Enabled { get; set; } = true;
    public string? Pattern { get; set; }
    public string? Flags { get; set; }
    public bool? IgnoreInString { get; set; }
    public bool? IgnoreInComments { get; set; }
    public string? Color { get; set; }
    public string? BackgroundColor { get; set; }
    public string? BorderColor { get; set; }
    public string? TextDecoration { get; set; }
    public List<string>? GroupColors { get; set; }
    public List<string>? GroupBackgrounds { get; set; }
    public List<string>? GroupTextDecorations { get; set; }
    public string? Condition { get; set; }
    public string? ConditionFlags { get; set; }
    public List<string>? LanguageIds { get; set; }
}
