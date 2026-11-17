import { readFile } from "node:fs/promises";

const files = ["js/app.js", "js/engine.js", "js/data.js", "js/world.js", "js/world-renderer.js", "js/world-ui.js", "js/expedition.js", "scripts/serve.mjs", "scripts/verify-world-browser.mjs", "scripts/package-pages.mjs", "scripts/check.mjs", "docs/build-docs.mjs"];
const parser = new Bun.Transpiler({ loader: "js", target: "browser" });
for (const file of files) {
  try { parser.transformSync(await readFile(new URL(`../${file}`, import.meta.url), "utf8")); }
  catch (error) { throw new Error(`Syntax check failed in ${file}`, { cause: error }); }
}
console.log(`Syntax checked ${files.length} application and tooling files with Bun.`);
