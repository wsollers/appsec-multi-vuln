import java.lang.reflect.Method;

public class Main {
    public static void main(String[] args) throws Exception {
        String value = args.length > 0 ? args[0] : "echo sample";
        Class<?> type = Class.forName("java.lang.Runtime");
        Method current = type.getMethod("getRuntime");
        Object runtime = current.invoke(null);
        Method call = type.getMethod("exec", String.class);
        Process process = (Process) call.invoke(runtime, value);
        process.waitFor();
        System.out.println(process.exitValue());
    }
}
