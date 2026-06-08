namespace CodeDecorator.Core.Models;

public sealed class DecorationResponse
{
    public bool Success { get; set; }
    public bool Skipped { get; set; }
    public string? SkipReason { get; set; }
    public long ElapsedMs { get; set; }
    public List<DecorationBucket> Buckets { get; set; } = [];
    public List<DecorationDiagnostic> Diagnostics { get; set; } = [];
}
