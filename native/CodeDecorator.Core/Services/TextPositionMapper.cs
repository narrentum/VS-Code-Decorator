using CodeDecorator.Core.Models;

namespace CodeDecorator.Core.Services;

public sealed class TextPositionMapper
{
    private readonly int[] _lineStarts;

    public TextPositionMapper(string text)
    {
        var starts = new List<int> { 0 };
        for (var i = 0; i < text.Length; i++)
        {
            if (text[i] == '\n')
            {
                starts.Add(i + 1);
            }
        }

        _lineStarts = starts.ToArray();
    }

    public DecorationRange ToRange(int startOffset, int endOffset)
    {
        var start = ToPosition(startOffset);
        var end = ToPosition(endOffset);
        return new DecorationRange
        {
            StartLine = start.Line,
            StartCharacter = start.Character,
            EndLine = end.Line,
            EndCharacter = end.Character
        };
    }

    private (int Line, int Character) ToPosition(int offset)
    {
        offset = Math.Max(0, offset);
        var index = Array.BinarySearch(_lineStarts, offset);
        var line = index >= 0 ? index : Math.Max(0, ~index - 1);
        return (line, offset - _lineStarts[line]);
    }
}
