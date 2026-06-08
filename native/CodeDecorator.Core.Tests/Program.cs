using CodeDecorator.Core.Services;

var source = """
public sealed class NoiseBorderBlendNode
{
    [Port(IN, Always, "value A: [IHasArray<float>] or [IHasArray<int>] + [IConverter<int, float>]")]
    [SerializeField, HideInInspector]
    public int Value;
}
""";

var scanner = new CSharpAttributeScanner();
var names = scanner.FindAttributeNames(source)
    .Select(range => source.Substring(range.Start, range.End - range.Start))
    .ToArray();

var expected = new[] { "Port", "SerializeField", "HideInInspector" };
if (!names.SequenceEqual(expected))
{
    throw new InvalidOperationException($"Expected [{string.Join(", ", expected)}], got [{string.Join(", ", names)}].");
}

Console.WriteLine("CSharpAttributeScanner regression passed.");
