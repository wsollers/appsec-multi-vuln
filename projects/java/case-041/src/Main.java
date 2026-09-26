import java.lang.reflect.Field;

public class Main {
    public static void main(String[] args) throws Exception {
        Field field = sun.misc.Unsafe.class.getDeclaredField("theUnsafe");
        field.setAccessible(true);
        sun.misc.Unsafe access = (sun.misc.Unsafe) field.get(null);
        long address = access.allocateMemory(16);
        access.putLong(address, 7L);
        access.freeMemory(address);
        System.out.println(access.getLong(address));
    }
}
