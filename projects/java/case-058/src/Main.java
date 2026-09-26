import java.io.StringReader;
import javax.xml.parsers.DocumentBuilderFactory;
import org.xml.sax.InputSource;

public class Main {
    public static void main(String[] args) throws Exception {
        String value = args.length > 0 ? args[0] : "<root>sample</root>";
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setExpandEntityReferences(true);
        var doc = factory.newDocumentBuilder().parse(new InputSource(new StringReader(value)));
        System.out.println(doc.getDocumentElement().getNodeName());
    }
}
