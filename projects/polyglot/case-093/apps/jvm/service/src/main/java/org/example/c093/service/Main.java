package org.example.c093.service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.example.c093.binding.Records;

public final class Main {
    private Main() {
    }

    private static String nativeLibrary() {
        String configured = System.getenv("C093_NATIVE");
        if (configured != null) {
            return configured;
        }
        Path built = Paths.get("build", "native", "bridge-jni", "libc093jni.so");
        return built.toAbsolutePath().toString();
    }

    private static int intArg(String[] args, int index, int fallback) {
        return args.length > index ? Integer.parseInt(args[index]) : fallback;
    }

    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("usage: Main describe FILE [OFFSET LENGTH] | label NAME [KIND] | fill ROWS WIDTH TEXT");
            System.exit(2);
        }
        Records.load(nativeLibrary());

        switch (args[0]) {
            case "describe" -> {
                byte[] data = Files.readAllBytes(Paths.get(args[1]));
                int offset = intArg(args, 2, 0);
                int length = intArg(args, 3, data.length - offset);
                System.out.println(Records.describe(data, offset, length));
            }
            case "label" -> System.out.println(Records.label(args[1], intArg(args, 2, 0)));
            case "fill" -> {
                int rows = Integer.parseInt(args[1]);
                int width = intArg(args, 2, 16);
                byte[] row = (args.length > 3 ? args[3] : "").getBytes(StandardCharsets.UTF_8);
                System.out.println(Records.fill(rows, width, row));
            }
            default -> {
                System.err.println("unknown command: " + args[0]);
                System.exit(2);
            }
        }
    }
}
