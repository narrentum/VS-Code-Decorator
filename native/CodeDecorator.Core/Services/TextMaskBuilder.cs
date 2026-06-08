namespace CodeDecorator.Core.Services;

public sealed class TextMaskBuilder
{
    public bool[] Build(string text, bool maskStrings, bool maskComments)
    {
        var masked = new bool[text.Length];
        var i = 0;

        while (i < text.Length)
        {
            if (maskComments && i + 1 < text.Length && text[i] == '/' && text[i + 1] == '/')
            {
                var start = i;
                i += 2;
                while (i < text.Length && text[i] != '\n')
                {
                    i++;
                }
                Mark(masked, start, i);
                continue;
            }

            if (maskComments && i + 1 < text.Length && text[i] == '/' && text[i + 1] == '*')
            {
                var start = i;
                i += 2;
                while (i + 1 < text.Length && !(text[i] == '*' && text[i + 1] == '/'))
                {
                    i++;
                }
                i = Math.Min(text.Length, i + 2);
                Mark(masked, start, i);
                continue;
            }

            if (maskStrings && IsRawStringStart(text, i, out var quoteCount))
            {
                var start = i;
                i += quoteCount;
                while (i < text.Length)
                {
                    if (HasQuoteRun(text, i, quoteCount))
                    {
                        i += quoteCount;
                        break;
                    }
                    i++;
                }
                Mark(masked, start, i);
                continue;
            }

            if (maskStrings && i + 1 < text.Length && text[i] == '@' && text[i + 1] == '"')
            {
                var start = i;
                i += 2;
                while (i < text.Length)
                {
                    if (text[i] == '"' && i + 1 < text.Length && text[i + 1] == '"')
                    {
                        i += 2;
                        continue;
                    }
                    if (text[i] == '"')
                    {
                        i++;
                        break;
                    }
                    i++;
                }
                Mark(masked, start, i);
                continue;
            }

            if (maskStrings && text[i] == '"')
            {
                var start = i++;
                while (i < text.Length)
                {
                    if (text[i] == '\\')
                    {
                        i += 2;
                        continue;
                    }
                    if (text[i] == '"')
                    {
                        i++;
                        break;
                    }
                    i++;
                }
                Mark(masked, start, i);
                continue;
            }

            if (maskStrings && text[i] == '\'')
            {
                var start = i++;
                while (i < text.Length)
                {
                    if (text[i] == '\\')
                    {
                        i += 2;
                        continue;
                    }
                    if (text[i] == '\'')
                    {
                        i++;
                        break;
                    }
                    i++;
                }
                Mark(masked, start, i);
                continue;
            }

            i++;
        }

        return masked;
    }

    private static void Mark(bool[] masked, int start, int end)
    {
        for (var i = start; i < end && i < masked.Length; i++)
        {
            masked[i] = true;
        }
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
