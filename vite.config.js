import { defineConfig } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
export default defineConfig({
  plugins: [
    {
      name: "local-gameplay-capture",
      configureServer(server) {
        server.middlewares.use("/__capture", async (req, res) => {
          const origin = req.headers.origin;
          let local = false;
          try {
            local = ["localhost", "127.0.0.1", "[::1]"].includes(
              new URL(origin).hostname,
            );
          } catch {
            /* Missing origins are not browser captures. */
          }
          if (req.method !== "POST" || !local) {
            res.statusCode = 403;
            res.end();
            return;
          }
          let data = "";
          for await (const chunk of req) {
            data += chunk;
            if (data.length > 10000000) {
              res.statusCode = 413;
              res.end();
              return;
            }
          }
          if (!data.startsWith("data:image/png;base64,")) {
            res.statusCode = 400;
            res.end();
            return;
          }
          const directory = path.resolve("docs/screenshots");
          await mkdir(directory, { recursive: true });
          const file = `gameplay-${Date.now()}.png`;
          await writeFile(
            path.join(directory, file),
            Buffer.from(data.slice(22), "base64"),
          );
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ path: `/docs/screenshots/${file}` }));
        });
      },
    },
  ],
  server: { hmr: false },
  base: "./",
  build: { chunkSizeWarningLimit: 1500 },
});
