import java.io.FileInputStream;
import java.io.ObjectInputStream;

public class Main {
    public static void main(String[] args) throws Exception {
        String name = args.length > 0 ? args[0] : "sample.bin";
        try (ObjectInputStream input = new ObjectInputStream(new FileInputStream(name))) {
            Object value = input.readObject();
            System.out.println(value);
        }
    }
}
