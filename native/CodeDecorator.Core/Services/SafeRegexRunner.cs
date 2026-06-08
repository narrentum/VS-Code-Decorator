using System.Text.RegularExpressions;
using CodeDecorator.Core.Models;

namespace CodeDecorator.Core.Services;

public sealed class SafeRegexRunner
{
    public bool IsMatch(string text, string pattern, string? flags, int timeoutMs, DecorationRule rule, List<DecorationDiagnostic> diagnostics)
    {
        try
        {
            var regex = CreateRegex(pattern, flags, timeoutMs);
            return regex.IsMatch(text);
        }
        catch (ArgumentException ex)
        {
            AddDiagnostic(rule, diagnostics, "error", $"Invalid condition regex: {ex.Message}");
            return false;
        }
        catch (RegexMatchTimeoutException)
        {
            AddDiagnostic(rule, diagnostics, "warning", $"Condition regex timed out after {timeoutMs} ms.");
            return false;
        }
    }

    public List<(int Start, int End, int GroupIndex)> FindMatches(
        string text,
        DecorationRule rule,
        bool[] masked,
        int timeoutMs,
        List<DecorationDiagnostic> diagnostics)
    {
        var ranges = new List<(int Start, int End, int GroupIndex)>();
        if (string.IsNullOrWhiteSpace(rule.Pattern))
        {
            AddDiagnostic(rule, diagnostics, "warning", "Rule has no pattern.");
            return ranges;
        }

        try
        {
            var regex = CreateRegex(rule.Pattern, rule.Flags, timeoutMs);
            foreach (Match match in regex.Matches(text))
            {
                if (!match.Success)
                {
                    continue;
                }

                if (match.Length == 0)
                {
                    AddDiagnostic(rule, diagnostics, "warning", "Zero-length match skipped.");
                    continue;
                }

                if (IsMasked(masked, match.Index))
                {
                    continue;
                }

                var groupCount = rule.GroupColors?.Count ?? 0;
                if (groupCount > 0)
                {
                    for (var groupIndex = 1; groupIndex <= groupCount && groupIndex < match.Groups.Count; groupIndex++)
                    {
                        var group = match.Groups[groupIndex];
                        if (!group.Success || group.Length == 0 || IsMasked(masked, group.Index))
                        {
                            continue;
                        }

                        ranges.Add((group.Index, group.Index + group.Length, groupIndex));
                    }
                }
                else
                {
                    ranges.Add((match.Index, match.Index + match.Length, 0));
                }
            }
        }
        catch (ArgumentException ex)
        {
            AddDiagnostic(rule, diagnostics, "error", $"Invalid regex: {ex.Message}");
        }
        catch (RegexMatchTimeoutException)
        {
            AddDiagnostic(rule, diagnostics, "warning", $"Regex timed out after {timeoutMs} ms.");
        }

        return ranges;
    }

    private static Regex CreateRegex(string pattern, string? flags, int timeoutMs)
    {
        var options = RegexOptions.CultureInvariant;
        flags ??= string.Empty;

        foreach (var flag in flags)
        {
            options |= flag switch
            {
                'i' => RegexOptions.IgnoreCase,
                'm' => RegexOptions.Multiline,
                's' => RegexOptions.Singleline,
                'x' => RegexOptions.IgnorePatternWhitespace,
                _ => RegexOptions.None
            };
        }

        return new Regex(pattern, options, TimeSpan.FromMilliseconds(Math.Max(1, timeoutMs)));
    }

    private static bool IsMasked(bool[] masked, int index)
    {
        return index >= 0 && index < masked.Length && masked[index];
    }

    private static void AddDiagnostic(DecorationRule rule, List<DecorationDiagnostic> diagnostics, string severity, string message)
    {
        diagnostics.Add(new DecorationDiagnostic
        {
            RuleDescription = rule.Description ?? rule.Pattern ?? rule.Kind ?? "Unnamed rule",
            Severity = severity,
            Message = message
        });
    }
}
