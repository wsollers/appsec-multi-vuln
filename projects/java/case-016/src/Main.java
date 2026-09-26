import java.io.BufferedReader;
import java.io.InputStreamReader;

public class Main {
    public static void main(String[] args) throws Exception {
        String value = args.length > 0 ? args[0] : "sample";
        String[] command = System.getProperty("os.name").toLowerCase().contains("win")
            ? new String[] {"cmd.exe", "/c", "echo " + value}
            : new String[] {"sh", "-c", "printf '%s\\n' " + value};
        Process process = Runtime.getRuntime().exec(command);
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        }
    }
}
