/* MATHALOID ATLAS — headless smoke tests (no browser needed). Node only.
   Verifies: pure 3D projection maths (world.js) and the new coding generators
   (engine.js). Run: node tests/world.test.js  — exits non-zero on failure. */
"use strict";

let failed = 0;
function ok(cond, msg) {
  if (cond) { console.log("  ok  " + msg); }
  else { failed++; console.error("FAIL  " + msg); }
}

/* ---- 1. Pure 3D maths ---- */
console.log("world.js projection:");
// world.js attaches globalThis.World3D as its public contract (works in browser + Node),
// so require() for its side effect, then read the global.
require("node:vm").runInThisContext(require("node:fs").readFileSync(require("node:path").join(__dirname, "../js/world.js"), "utf8"), { filename: "world.js" });
const World3D = globalThis.World3D;
ok(!!World3D && typeof World3D.project === "function", "World3D API is exposed");

const vp = { cx: 400, cy: 300, focal: 600 };
const cam = { x: 0, y: 1.7, z: 0, yaw: 0, pitch: 0 }; // facing -z

// A point straight ahead (-z) should be visible and centred horizontally.
const ahead = World3D.project(0, 1.7, -10, cam, vp);
ok(ahead.visible === true, "point ahead is visible");
ok(Math.abs(ahead.x - 400) < 0.001, "point ahead is horizontally centred");
ok(ahead.depth > 0, "point ahead has positive depth");

// A point behind the camera must be hidden.
const behind = World3D.project(0, 1.7, 10, cam, vp);
ok(behind.visible === false, "point behind camera is hidden");

// A point to the right projects to the right of centre.
const right = World3D.project(5, 1.7, -10, cam, vp);
ok(right.visible === true && right.x > 400, "point to the right projects right");

// Terrain is bounded & deterministic.
const t1 = World3D.terrainHeight(3.2, -7.7), t2 = World3D.terrainHeight(3.2, -7.7);
ok(t1 === t2, "terrain is deterministic");
ok(Math.abs(t1) < 2, "terrain stays within a gentle range");

// Turning 180° swaps ahead/behind visibility.
const cam2 = { x: 0, y: 1.7, z: 0, yaw: Math.PI, pitch: 0 };
ok(World3D.project(0, 1.7, -10, cam2, vp).visible === false, "180° turn hides old-ahead point");
ok(World3D.project(0, 1.7, 10, cam2, vp).visible === true, "180° turn reveals old-behind point");

/* ---- 2. Coding generators (engine.js) ---- */
console.log("engine.js coding generators:");
// engine.js declares `const Engine = (() => ...)()` — a top-level lexical binding that
// classic <script> tags share in the browser, but which Node's require() isolates.
// Mirror the browser by running data.js + engine.js in one shared VM context.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const sandbox = {
  console,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  Date, Math, JSON, Set, Map, Object, Array, Number, String, isNaN, parseInt, parseFloat,
};
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const f of ["js/data.js", "js/engine.js"]) {
  const src = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
  // engine.js ends with `const Engine = (() => ...)()`; its lexical binding isn't visible on
  // the sandbox object, so for engine.js we append a line that publishes it.
  const probe = f === "js/engine.js" ? src + "\n;globalThis.__Engine = Engine;" : src;
  vm.runInContext(probe, sandbox, { filename: f });
}
const E = sandbox.__Engine;
ok(!!E && typeof E.generate === "function", "Engine.generate is available in shared script scope");


const gens = ["codevar", "codecond", "codeloop", "codefunc", "codeseq"];
for (const g of gens) {
  const q = E.generate(g, 4);
  const shapeOk = q && typeof q.prompt === "string" && Array.isArray(q.options) &&
    q.options.length >= 2 && typeof q.answer === "string" && q.options.includes(q.answer) &&
    Array.isArray(q.hints) && typeof q.explain === "string" && q.skillId;
  ok(!!shapeOk, `generator ${g} returns a well-formed question with answer in options`);
}

// Deterministic numeric spot-checks on the maths inside coding questions.
let loopOk = true;
for (let i = 0; i < 200; i++) {
  const q = E.generate("codeloop", 5);
  const n = Number((q.prompt.match(/to (\d+):/) || [])[1]);
  if (!n || Number(q.answer) !== (n * (n + 1)) / 2) { loopOk = false; break; }
}
ok(loopOk, "codeloop answer always equals n(n+1)/2");

let condOk = true;
for (let i = 0; i < 200; i++) {
  const q = E.generate("codecond", 4);
  const m = q.prompt.match(/(\d+)\s*(>=|<=|>|<)\s*(\d+)/);
  if (!m) { condOk = false; break; }
  const [, a, op, b] = m;
  const real = op === ">" ? +a > +b : op === "<" ? +a < +b : op === ">=" ? +a >= +b : +a <= +b;
  if (q.answer !== (real ? "true" : "false")) { condOk = false; break; }
}
ok(condOk, "codecond answer matches the real comparison");

// Deterministic, data-driven world region generator validation.
console.log("world regions -> generators:");
const fs2 = require("fs");
const path2 = require("path");
const vm2 = require("vm");
const sb = {
  console, localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  Date, Math, JSON, Set, Map, Object, Array, Number, String, isNaN, parseInt, parseFloat,
};
sb.window = sb;
vm2.createContext(sb);
for (const f of ["js/data.js", "js/engine.js"]) {
  vm2.runInContext(fs2.readFileSync(path2.join(__dirname, "..", f), "utf8"), sb, { filename: f });
}
const world = vm2.runInContext("ATLAS.WORLD", sb);
ok(!!world && Array.isArray(world.regions) && world.regions.length >= 6, "ATLAS.WORLD has 6+ regions");
const EngineRef = vm2.runInContext("Engine", sb);
let resolveOk = true, missing = [];
for (const r of world.regions) {
  for (const g of r.gens) {
    const q = EngineRef.generate(g, 3);
    if (!q || q.gen !== g) { resolveOk = false; missing.push(`${r.id}->${g}`); }
  }
}
ok(resolveOk, `every world region gen resolves to its own generator${missing.length ? " (missing: " + missing.join(", ") + ")" : ""}`);
ok(world.regions.every((r) => r.color && r.icon && r.name && r.tagline), "every region has name/icon/color/tagline");

console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
