import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const sources = ["data", "expedition", "engine"].map(name => readFileSync(new URL(`../js/${name}.js`, import.meta.url), "utf8"));
function openEngine(storage) {
  const context = vm.createContext({ localStorage: storage, console });
  for (const source of sources) vm.runInContext(source, context);
  return vm.runInContext("Engine", context);
}
function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test("malformed nested backup data preserves both live and persisted progress", () => {
  const storage = memoryStorage(), engine = openEngine(storage);
  engine.state.xp = 321; engine.state.notes = "My lab notes"; engine.save();
  const before = engine.exportJSON(), stored = storage.getItem("atlas.state.v1");
  for (const bad of [{ xp: 0, settings: null }, { xp: 0, skills: { bridge: null } }, { xp: 0, passport: { apply: "bad" } }, { xp: 0, bookmarks: null }, { xp: 0, leaderboard: [{ name: "A", xp: null }] }, { xp: 0, settings: { grade: "invalid" } }]) {
    assert.throws(() => engine.importJSON(JSON.stringify(bad)), /valid Atlas backup/);
    assert.equal(engine.exportJSON(), before); assert.equal(storage.getItem("atlas.state.v1"), stored);
  }
  assert.throws(() => engine.importJSON('{"xp":1e309}'));
});

test("partial old backups receive safe nested defaults and valid expedition data survives", () => {
  const storage = memoryStorage(), engine = openEngine(storage);
  assert.equal(engine.importJSON('{"xp":42,"settings":{"grade":"9"}}'), true);
  assert.equal(engine.state.settings.theme, "cosmic"); assert.equal(engine.state.settings.grade, "9");
  const restored = openEngine(storage); assert.equal(restored.state.xp, 42); assert.equal(restored.state.settings.sound, true);
});

test("a stale second tab cannot overwrite a newer completion and XP", () => {
  const storage = memoryStorage(), first = openEngine(storage), second = openEngine(storage);
  first.state.xp = 80;
  first.state.expedition = { version: 1, completed: { "bridge:standard": { at: 1, values: { length: 10 } } } };
  assert.equal(first.save(), true);
  const stored = storage.getItem("atlas.state.v1");
  second.state.notes = "Unsaved second-tab note";
  assert.equal(second.save(), false); assert.equal(second.saveIssue, "conflict");
  assert.equal(storage.getItem("atlas.state.v1"), stored);
  assert.equal(second.state.notes, "Unsaved second-tab note", "session remains exportable");
  const reopened = openEngine(storage); assert.equal(reopened.state.xp, 80); assert(reopened.state.expedition.completed["bridge:standard"]);
});

test("blocked storage restore reports session-only success and keeps the original stored data", () => {
  const storage = memoryStorage(), engine = openEngine(storage);
  engine.state.xp = 80; engine.save();
  const stored = storage.getItem("atlas.state.v1"); storage.setItem = () => { throw new Error("Quota exceeded"); };
  assert.equal(engine.importJSON('{"xp":120}'), false); assert.equal(engine.saveIssue, "storage");
  assert.equal(engine.state.xp, 120); assert.equal(storage.getItem("atlas.state.v1"), stored);
});
