namespace CodeDecorator.Core.Services;

public sealed class CSharpAttributeScanner
{
    public List<(int Start, int End)> FindAttributeNames(string text)
    {
        var ranges = new List<(int Start, int End)>();
        var i = 0;

        while (i < text.Length)
        {
            if (TrySkipTriviaOrLiteral(text, ref i))
            {
                continue;
            }

            if (text[i] == '[' && LooksLikeAttributeStart(text, i))
            {
                i = ScanAttributeBlock(text, i + 1, ranges);
                continue;
            }

            i++;
        }

        return ranges;
    }

    private static int ScanAttributeBlock(string text, int index, List<(int Start, int End)> ranges)
    {
        var i = index;
        var parenDepth = 0;
        var expectingName = true;

        while (i < text.Length)
        {
            if (TrySkipTriviaOrLiteral(text, ref i))
            {
                continue;
            }

            var ch = text[i];
            if (parenDepth == 0 && ch == ']')
            {
                return i + 1;
            }

            if (ch == '(')
            {
                parenDepth++;
                i++;
                continue;
            }

            if (ch == ')' && parenDepth > 0)
            {
                parenDepth--;
                i++;
                continue;
            }

            if (parenDepth == 0 && ch == ',')
            {
                expectingName = true;
                i++;
                continue;
            }

            if (expectingName)
            {
                if (char.IsWhiteSpace(ch))
                {
                    i++;
                    continue;
                }

                if (IsIdentifierStart(ch))
                {
                    var start = i;
                    i++;
                    while (i < text.Length && (IsIdentifierPart(text[i]) || text[i] == '.'))
                    {
                        i++;
                    }

                    ranges.Add((start, i));
                    expectingName = false;
                    continue;
                }

                expectingName = false;
            }

            i++;
        }

        return i;
    }

    private static bool LooksLikeAttributeStart(string text, int bracketIndex)
    {
        var i = bracketIndex + 1;
        while (i < text.Length && char.IsWhiteSpace(text[i]))
        {
            i++;
        }

        return i < text.Length && IsIdentifierStart(text[i]);
    }

    private static bool TrySkipTriviaOrLiteral(string text, ref int index)
    {
        if (index >= text.Length)
        {
            return false;
        }

        if (index + 1 < text.Length && text[index] == '/' && text[index + 1] == '/')
        {
            index += 2;
            while (index < text.Length && text[index] != '\n')
            {
                index++;
            }
            return true;
        }

        if (index + 1 < text.Length && text[index] == '/' && text[index + 1] == '*')
        {
            index += 2;
            while (index + 1 < text.Length && !(text[index] == '*' && text[index + 1] == '/'))
            {
                index++;
            }
            index = Math.Min(text.Length, index + 2);
            return true;
        }

        if (IsRawStringStart(text, index, out var quoteCount))
        {
            index += quoteCount;
            while (index < text.Length)
            {
                if (HasQuoteRun(text, index, quoteCount))
                {
                    index += quoteCount;
                    break;
                }
                index++;
            }
            return true;
        }

        if (index + 1 < text.Length && text[index] == '@' && text[index + 1] == '"')
        {
            index += 2;
            while (index < text.Length)
            {
                if (text[index] == '"' && index + 1 < text.Length && text[index + 1] == '"')
                {
                    index += 2;
                    continue;
                }
                if (text[index] == '"')
                {
                    index++;
                    break;
                }
                index++;
            }
            return true;
        }

        if (text[index] == '"')
        {
            index++;
            while (index < text.Length)
            {
                if (text[index] == '\\')
                {
                    index += 2;
                    continue;
                }
                if (text[index] == '"')
                {
                    index++;
                    break;
                }
                index++;
            }
            return true;
        }

        if (text[index] == '\'')
        {
            index++;
            while (index < text.Length)
            {
                if (text[index] == '\\')
                {
                    index += 2;
                    continue;
                }
                if (text[index] == '\'')
                {
                    index++;
                    break;
                }
                index++;
            }
            return true;
        }

        return false;
    }

    private static bool IsIdentifierStart(char ch)
    {
        return ch == '_' || char.IsLetter(ch);
    }

    private static bool IsIdentifierPart(char ch)
    {
        return ch == '_' || char.IsLetterOrDigit(ch);
    }

    private static bool IsRawStringStart(string text, int index, out int quoteCount)
    {
        quoteCount = 0;
        if (text[index] != '"')
        {
            return false;
        }

        while (index + quoteCount < text.Length && text[index + quoteCount] == '"')
        {
            quoteCount++;
        }

        return quoteCount >= 3;
    }

    private static bool HasQuoteRun(string text, int index, int quoteCount)
    {
        if (index + quoteCount > text.Length)
        {
            return false;
        }

        for (var i = 0; i < quoteCount; i++)
        {
            if (text[index + i] != '"')
            {
                return false;
            }
        }

        return true;
    }
}
