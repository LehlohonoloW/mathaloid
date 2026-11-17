import { cp, mkdir, mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = await mkdtemp(join(tmpdir(), "mathaloid-pages-"));
for (const file of ["index.html", "LICENSE", "README.md", "CHANGELOG.md"]) {
  await cp(resolve(root, file), join(output, file));
}
async function copyTree(directory, extensions) {
  const source = resolve(root, directory);
  const target = join(output, directory);
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const local = join(directory, entry.name);
    if (entry.isDirectory()) await copyTree(local, extensions);
    else if (entry.isFile() && extensions.some(extension => entry.name.endsWith(extension))) {
      await cp(resolve(root, local), join(output, local));
    }
  }
}
await copyTree("css", [".css"]);
await copyTree("js", [".js"]);
await copyTree("docs", [".md", ".html", ".json", ".css", ".js", ".svg"]);
console.log(output);
