using System.Xml;

var value = args.Length > 0 ? args[0] : "<root>sample</root>";
var settings = new XmlReaderSettings
{
    DtdProcessing = DtdProcessing.Parse,
    XmlResolver = new XmlUrlResolver()
};
using var reader = XmlReader.Create(new StringReader(value), settings);
while (reader.Read())
{
    if (reader.NodeType == XmlNodeType.Text)
    {
        Console.WriteLine(reader.Value);
    }
}
