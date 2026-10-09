import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/** Zero-dependency static server for the Hub. Run via Start-Hub.bat.
 *  Serves this folder over http://localhost so YouTube embeds work
 *  (YouTube refuses file:// origins with Error 153). */
public class ServeHub {
    public static void main(String[] args) throws IOException {
        final Path root = Paths.get("").toAbsolutePath();
        final Map<String, String> mime = new HashMap<>();
        mime.put("html", "text/html; charset=utf-8");
        mime.put("css", "text/css; charset=utf-8");
        mime.put("js", "text/javascript; charset=utf-8");
        mime.put("json", "application/json");
        mime.put("png", "image/png");
        mime.put("jpg", "image/jpeg");
        mime.put("jpeg", "image/jpeg");
        mime.put("svg", "image/svg+xml");
        mime.put("webp", "image/webp");
        mime.put("ico", "image/x-icon");
        mime.put("mp4", "video/mp4");
        mime.put("webm", "video/webm");

        HttpServer server = null;
        int port = -1;
        for (int p = 8080; p <= 8090 && server == null; p++) {
            try {
                server = HttpServer.create(new InetSocketAddress(p), 0);
                port = p;
            } catch (IOException busy) { server = null; }
        }
        if (server == null) { System.err.println("No free port 8080-8090."); System.exit(1); }

        server.createContext("/", exchange -> {
            try {
                String raw = exchange.getRequestURI().getPath();
                if (raw.endsWith("/")) raw += "index.html";
                Path file = root.resolve(raw.substring(1)).normalize();
                if (!file.startsWith(root) || !Files.isRegularFile(file)) {
                    byte[] notFound = "404".getBytes();
                    exchange.sendResponseHeaders(404, notFound.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(notFound); }
                    return;
                }
                String name = file.getFileName().toString();
                String ext = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1).toLowerCase() : "";
                exchange.getResponseHeaders().set("Content-Type", mime.getOrDefault(ext, "application/octet-stream"));
                exchange.getResponseHeaders().set("Cache-Control", "no-store");
                byte[] body = Files.readAllBytes(file);
                exchange.sendResponseHeaders(200, body.length);
                try (OutputStream os = exchange.getResponseBody()) { os.write(body); }
            } finally { exchange.close(); }
        });
        server.setExecutor(null);
        server.start();
        String url = "http://localhost:" + port + "/";
        System.out.println("Unstable SMP Hub: " + url);
        try {
            java.util.Enumeration<java.net.NetworkInterface> ifs = java.net.NetworkInterface.getNetworkInterfaces();
            while (ifs.hasMoreElements()) {
                java.util.Enumeration<java.net.InetAddress> addrs = ifs.nextElement().getInetAddresses();
                while (addrs.hasMoreElements()) {
                    java.net.InetAddress a = addrs.nextElement();
                    if (a.isSiteLocalAddress() && !a.isLoopbackAddress()) {
                        System.out.println("On your phone (same Wi-Fi): http://" + a.getHostAddress() + ":" + port + "/");
                    }
                }
            }
        } catch (Exception ignored) { }
        System.out.println("Serving: " + root);
        System.out.println("Tip: Windows Firewall may ask to allow Java - click Allow, else phones can't connect.");
        System.out.println("Close this window to stop.");
        try {
            if (java.awt.Desktop.isDesktopSupported()) {
                java.awt.Desktop.getDesktop().browse(new java.net.URI(url));
            }
        } catch (Exception ignored) { /* headless: URL is printed above */ }
    }
}
