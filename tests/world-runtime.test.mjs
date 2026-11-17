import assert from "node:assert/strict";
import test from "node:test";
await import("../js/world.js");
const W = globalThis.World3D;

test("navigation bearings follow world coordinates and player facing", () => {
  const p = { x: 0, z: 0, yaw: 0 };
  assert.equal(W.navigationTo(p, { x: 0, z: -20 }).direction, "Straight ahead");
  assert.equal(W.navigationTo(p, { x: 20, z: 0 }).compass, "E");
  assert.equal(W.navigationTo(p, { x: 20, z: 0 }).direction, "Turn right");
  assert.equal(W.navigationTo(p, { x: -20, z: 0 }).direction, "Turn left");
  assert.equal(W.navigationTo(p, { x: 0, z: 20 }).direction, "Turn around");
  assert.equal(W.navigationTo({ ...p, yaw: Math.PI / 2 }, { x: 20, z: 0 }).direction, "Straight ahead");
  assert.equal(W.navigationTo(p, { x: 3, z: -4 }).distance, 5);
  assert.equal(W.navigationTo(p, { x: 3, z: -4 }).direction, "You have arrived");
  assert.equal(W.navigationTo(p, { x: -20, z: -20 }).compass, "NW");
});
const player = overrides => ({ x: 0, z: 28, y: 3, yaw: 0, pitch: 0, lift: 0, vy: 0, ...overrides });
const simulate = (p, keys, seconds, completed = []) => { for (let i = 0; i < seconds * 60; i++) W.stepPlayer(p, keys, W.STEP, completed); return p; };

test("movement speed is identical along axes and diagonals", () => {
  const a = simulate(player(), { forward: true }, 1);
  const b = simulate(player(), { forward: true, right: true }, 1);
  assert(Math.abs(Math.hypot(a.x, a.z - 28) - 7) < 1e-9);
  assert(Math.abs(Math.hypot(b.x, b.z - 28) - 7) < 1e-9);
  const runner = simulate(player(), { forward: true, sprint: true }, 1);
  assert(Math.abs(runner.z - 15) < 1e-9);
});
test("water blocks the crossing until a bridge is restored, and has a detour", () => {
  const waiting = simulate(player({ x: -24, z: 10 }), { left: true }, 2);
  assert(waiting.x >= -25);
  const crossing = simulate(player({ x: -24, z: 10 }), { left: true }, 2, ["bridge"]);
  assert(crossing.x < -35);
  assert.equal(W.walkable(-30, -40, []), true);
  assert.equal(W.walkable(-30, 25, ["bridge"]), false);
});
test("jump returns to ground and requires a new press", () => {
  const p = player(); W.stepPlayer(p, { jump: true }, W.STEP); assert(p.lift > 0);
  simulate(p, { jump: true }, 2); assert.equal(p.lift, 0);
  W.stepPlayer(p, {}, W.STEP); W.stepPlayer(p, { jump: true }, W.STEP); assert(p.lift > 0);
});
test("world bounds and delayed-frame time are bounded", () => {
  const p = player({ x: 99.9 }); W.stepPlayer(p, { right: true }, 10);
  assert.equal(p.x, 100);
  const moved = player(); W.stepPlayer(moved, { forward: true }, 10);
  assert(Math.abs(moved.z - (28 - 7 / 60)) < 1e-10);
  assert.equal(W.walkable(101, 0, []), false);
});
test("tree trunk collision stops movement instead of allowing overlap", () => {
  const p = player();
  for (let i = 0; i < 120; i++) W.stepPlayer(p, { forward: true }, W.STEP, [], [{ x: 0, z: 25, r: 0.55 }]);
  assert(p.z > 25.8);
});
