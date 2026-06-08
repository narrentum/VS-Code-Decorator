using System.Diagnostics;
using CodeDecorator.Core.Models;

namespace CodeDecorator.Core.Services;

public sealed class DecorationEngine
{
    private readonly SafeRegexRunner _regexRunner = new();
    private readonly TextMaskBuilder _maskBuilder = new();
    private readonly CSharpAttributeScanner _attributeScanner = new();

    public DecorationResponse Process(DecorationRequest request)
    {
        var stopwatch = Stopwatch.StartNew();
        var response = new DecorationResponse { Success = true };

        if (request.DocumentText.Length > request.MaxFileLength)
        {
            response.Skipped = true;
            response.SkipReason = $"Document length {request.DocumentText.Length} exceeds maxFileLength {request.MaxFileLength}.";
            response.Diagnostics.Add(new DecorationDiagnostic
            {
                Severity = "info",
                Message = response.SkipReason
            });
            stopwatch.Stop();
            response.ElapsedMs = stopwatch.ElapsedMilliseconds;
            return response;
        }

        var mapper = new TextPositionMapper(request.DocumentText);
        var buckets = new Dictionary<string, DecorationBucket>();

        for (var index = 0; index < request.Rules.Count; index++)
        {
            var rule = request.Rules[index];
            if (!rule.Enabled || !LanguageMatches(rule, request.LanguageId))
            {
                continue;
            }

            var ruleDescription = rule.Description ?? rule.Pattern ?? rule.Kind ?? $"Rule {index + 1}";
            if (!string.IsNullOrWhiteSpace(rule.Condition))
            {
                var conditionFlags = string.IsNullOrWhiteSpace(rule.ConditionFlags) ? "i" : rule.ConditionFlags;
                if (!_regexRunner.IsMatch(request.DocumentText, rule.Condition, conditionFlags, request.RegexTimeoutMs, rule, response.Diagnostics))
                {
                    continue;
                }
            }

            if (string.Equals(rule.Kind, "csharpAttributeNames", StringComparison.OrdinalIgnoreCase))
            {
                if (!IsCSharpDocument(request))
                {
                    continue;
                }

                foreach (var range in _attributeScanner.FindAttributeNames(request.DocumentText))
                {
                    AddRange(buckets, rule, index, 1, ruleDescription, mapper.ToRange(range.Start, range.End));
                }

                continue;
            }

            var mask = _maskBuilder.Build(
                request.DocumentText,
                rule.IgnoreInString == true,
                rule.IgnoreInComments == true);

            foreach (var match in _regexRunner.FindMatches(request.DocumentText, rule, mask, request.RegexTimeoutMs, response.Diagnostics))
            {
                AddRange(buckets, rule, index, match.GroupIndex, ruleDescription, mapper.ToRange(match.Start, match.End));
            }
        }

        response.Buckets = buckets.Values.Where(bucket => bucket.Ranges.Count > 0).ToList();
        stopwatch.Stop();
        response.ElapsedMs = stopwatch.ElapsedMilliseconds;
        return response;
    }

    private static bool LanguageMatches(DecorationRule rule, string languageId)
    {
        return rule.LanguageIds is not { Count: > 0 }
            || rule.LanguageIds.Any(id => string.Equals(id, languageId, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsCSharpDocument(DecorationRequest request)
    {
        return string.Equals(request.LanguageId, "csharp", StringComparison.OrdinalIgnoreCase)
            || request.FileName.EndsWith(".cs", StringComparison.OrdinalIgnoreCase);
    }

    private static void AddRange(
        Dictionary<string, DecorationBucket> buckets,
        DecorationRule rule,
        int ruleIndex,
        int groupIndex,
        string ruleDescription,
        DecorationRange range)
    {
        var color = groupIndex > 0 ? GetAt(rule.GroupColors, groupIndex - 1, rule.Color) : rule.Color;
        var backgroundColor = groupIndex > 0 ? GetAt(rule.GroupBackgrounds, groupIndex - 1, rule.BackgroundColor) : rule.BackgroundColor;
        var textDecoration = groupIndex > 0 ? GetAt(rule.GroupTextDecorations, groupIndex - 1, rule.TextDecoration) : rule.TextDecoration;
        var ruleId = groupIndex > 0 ? $"rule-{ruleIndex}-group-{groupIndex - 1}" : $"rule-{ruleIndex}";
        var key = string.Join("|", ruleId, color, backgroundColor, rule.BorderColor, textDecoration);

        if (!buckets.TryGetValue(key, out var bucket))
        {
            bucket = new DecorationBucket
            {
                RuleId = ruleId,
                RuleDescription = ruleDescription,
                Color = color,
                BackgroundColor = backgroundColor,
                BorderColor = rule.BorderColor,
                TextDecoration = textDecoration
            };
            buckets[key] = bucket;
        }

        bucket.Ranges.Add(range);
    }

    private static string? GetAt(List<string>? values, int index, string? fallback)
    {
        if (values is null || index < 0 || index >= values.Count || string.IsNullOrWhiteSpace(values[index]))
        {
            return fallback;
        }

        return values[index];
    }
}
