import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpsConfigurator;
import com.sun.net.httpserver.HttpsServer;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.CertificateFactory;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.cert.X509Certificate;

public class Main {
    static Path rootPath() throws Exception {
        Path p = Path.of("").toAbsolutePath();
        while (!Files.exists(p.resolve("support/local.crt"))) {
            if (p.getParent() == null) return Path.of(".").toAbsolutePath();
            p = p.getParent();
        }
        return p;
    }

    static void handle(HttpExchange exchange) throws java.io.IOException {
        URI uri = exchange.getRequestURI();
        String raw = uri.getRawQuery() == null ? "" : uri.getRawQuery();
        String target = "/";
        for (String part : raw.split("&")) {
            if (part.startsWith("next=")) {
                target = part.substring(5);
            }
        }
        exchange.getResponseHeaders().add("Location", target);
        exchange.sendResponseHeaders(302, 0);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write("case-049".getBytes());
        }
    }

    static PrivateKey privateKey(Path path) throws Exception {
        String text = Files.readString(path)
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replaceAll("\\s", "");
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(text)));
    }

    public static void main(String[] args) throws Exception {
        TrustManager[] trust = new TrustManager[] { new X509TrustManager() {
            public void checkClientTrusted(X509Certificate[] chain, String authType) {}
            public void checkServerTrusted(X509Certificate[] chain, String authType) {}
            public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
        }};
        SSLContext clientContext = SSLContext.getInstance("TLS");
        clientContext.init(null, trust, new java.security.SecureRandom());
        HttpsURLConnection.setDefaultSSLSocketFactory(clientContext.getSocketFactory());
        HttpsURLConnection.setDefaultHostnameVerifier((HostnameVerifier) (name, session) -> true);

        Path root = rootPath();
        CertificateFactory factory = CertificateFactory.getInstance("X.509");
        var cert = factory.generateCertificate(Files.newInputStream(root.resolve("support/local.crt")));
        KeyStore store = KeyStore.getInstance(KeyStore.getDefaultType());
        store.load(null, null);
        store.setKeyEntry("local", privateKey(root.resolve("support/local.key")), new char[0], new java.security.cert.Certificate[] { cert });
        KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        kmf.init(store, new char[0]);

        HttpServer http = HttpServer.create(new InetSocketAddress(8080), 0);
        http.createContext("/go", Main::handle);
        http.start();

        HttpsServer https = HttpsServer.create(new InetSocketAddress(8443), 0);
        SSLContext context = SSLContext.getInstance("TLSv1");
        context.init(kmf.getKeyManagers(), trust, new java.security.SecureRandom());
        https.setHttpsConfigurator(new HttpsConfigurator(context));
        https.createContext("/go", Main::handle);
        https.start();
        System.out.println("case-049");
    }
}
