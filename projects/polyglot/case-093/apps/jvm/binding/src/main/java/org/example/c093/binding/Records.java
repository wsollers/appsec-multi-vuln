package org.example.c093.binding;

/** Java entry points implemented by the native bridge library. */
public final class Records {
    private Records() {
    }

    /** Loads the bridge library from an absolute file path. */
    public static void load(String path) {
        System.load(path);
    }

    /** Parses {@code length} bytes of {@code data} starting at {@code offset}. */
    public static native String describe(byte[] data, int offset, int length);

    /** Describes a record that carries only a name and a kind. */
    public static native String label(String name, int kind);

    /** Fills a table of {@code rows} rows, {@code width} bytes each, with {@code row}. */
    public static native int fill(int rows, int width, byte[] row);
}
