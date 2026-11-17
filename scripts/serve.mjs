import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, relative, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".md": "text/plain; charset=utf-8" };
export function createAtlasServer() {
  return createServer(async (request, response) => {
    try {
      if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405); response.end(); return; }
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const target = resolve(root, "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname));
      const local = relative(root, target);
      if (local.startsWith(".." + sep) || local === ".." || local.split(sep).some(segment => segment.startsWith("."))) { response.writeHead(403); response.end("Forbidden"); return; }
      const content = await readFile(target);
      response.writeHead(200, { "Content-Type": types[extname(target)] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch (error) { response.writeHead(error.code === "ENOENT" || error.code === "EISDIR" ? 404 : 400); response.end("File unavailable"); }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.ATLAS_PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("ATLAS_PORT must be a valid port.");
  const server = createAtlasServer();
  server.listen(port, "127.0.0.1", () => console.log(`Mathaloid: http://127.0.0.1:${port}/`));
}
