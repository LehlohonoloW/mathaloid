import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";
import { createAtlasServer } from "./serve.mjs";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require(process.env.ATLAS_PLAYWRIGHT_MODULE || "playwright")); }
catch { throw new Error("Set ATLAS_PLAYWRIGHT_MODULE to an installed playwright or playwright-core module. This verification tool adds no runtime dependency."); }
const evidence = process.env.ATLAS_EVIDENCE_DIR ? resolve(process.env.ATLAS_EVIDENCE_DIR) + sep : fileURLToPath(new URL("../docs/.docs/evidence/", import.meta.url));
await mkdir(evidence, { recursive: true });
const server = createAtlasServer();
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.ATLAS_CHROMIUM || undefined, args: ["--enable-unsafe-swiftshader"] });
const report = { date: new Date().toISOString(), toolingRuntime: `Node ${process.versions.node}`, checks: [], errors: [], externalRequests: [], performance: {}, screenshots: [], renderer: "", limits: ["Headless Chromium on this Windows host; school hardware, Safari/Firefox and physical gamepads remain unverified."] };
const check = (name, condition) => { assert(condition, name); report.checks.push(name); console.log("PASS " + name); };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function observe(page) {
  page.on("pageerror", error => report.errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") report.errors.push(message.text()); });
  page.on("request", request => { if (!request.url().startsWith(origin) && !request.url().startsWith("data:")) report.externalRequests.push(request.url()); });
}
async function shot(page, name) { const path = evidence + name + ".png"; await page.screenshot({ path }); report.screenshots.push(path); }
const stats = page => page.evaluate(() => App.worldStats());
const state = page => page.evaluate(() => JSON.parse(Engine.exportJSON()));
async function setValues(page, values) {
  for (const [key, value] of Object.entries(values)) await page.locator(`[data-value="${key}"]`).evaluate((node, value) => { node.value = String(value); node.dispatchEvent(new Event("input", { bubbles: true })); }, value);
}
async function lab(page, id) {
  if (await page.locator("#worldDialog[open]").count()) await page.locator("#worldDialog").evaluate(node => node.close());
  await page.locator("#worldMapButton").click(); await page.locator(`[data-lab="${id}"]`).click();
}
async function solve(page, id, difficulty, wrongReflection = false) {
  await lab(page, id);
  const task = await page.evaluate(({ id, difficulty }) => ({ solution: Expedition.sampleSolution(id, difficulty), reflection: Expedition.mission(id, difficulty).reflection }), { id, difficulty });
  await setValues(page, task.solution);
  await page.locator("#worldPrediction").fill("1");
  const xp = (await state(page)).xp;
  await page.locator("#worldRun").click();
  check(`${id}:${difficulty} succeeds physically`, (await page.locator("#worldResult").innerText()).includes("Your experiment worked"));
  check(`${id}:${difficulty} waits for explanation before credit`, (await state(page)).xp === xp);
  check(`${id}:${difficulty} compares a prediction with measured units`, (await page.locator("#worldResult .world-prediction-evidence").innerText()).includes("observed"));
  if (wrongReflection) {
    await page.getByRole("button", { name: task.reflection.options.find(option => option !== task.reflection.answer), exact: true }).click();
    check("incorrect explanation cannot earn XP", (await state(page)).xp === xp);
  }
  await page.getByRole("button", { name: task.reflection.answer, exact: true }).click();
  check(`${id}:${difficulty} records restored station`, !!(await state(page)).expedition.completed[`${id}:${difficulty}`]);
  check(`${id}:${difficulty} saves the original prediction`, (await state(page)).expedition.attempts.at(-1).prediction === 1);
  await page.getByRole("button", { name: "Return to the plateau", exact: false }).click();
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); observe(page);
  await page.goto(origin + "/#world"); await page.locator("#worldStart").waitFor();
  await shot(page, "world-welcome");
  await page.locator("#worldStart").click(); await delay(1700);
  check("world entry opens the playable 3D world", (await stats(page)).renderer === "WebGL");
  check("initial coordinates use south for positive world z", (await page.locator("#worldCoordinates").innerText()).includes("S"));
  const beforeTracking = (await stats(page)).position;
  await page.locator("#worldMapButton").click();
  await page.locator('[data-track="energy"]').click();
  check("tracking a chosen station updates objective without teleporting", (await page.locator("#worldObjectiveName").innerText()).includes("Power") && Math.abs((await stats(page)).position.x - beforeTracking.x) < 0.01);
  check("tracked destination gives distance and steering guidance", /m (?:N|NE|E|SE|S|SW|W|NW)/.test(await page.locator("#worldNavigation").innerText()));
  for (const [button, close] of [["#worldMapButton", "Close map"], ["#worldJournalButton", "Close field notes"], ["#worldSettingsButton", "Resume expedition"]]) {
    await page.locator(button).focus(); await page.keyboard.press("Space");
    check(`Space activates focused ${button} without jumping`, await page.locator("#worldDialog").evaluate(node => node.open) && (await stats(page)).lift === 0);
    await page.getByRole("button", { name: close, exact: true }).click();
  }
  report.renderer = (await stats(page)).renderer;
  const initialContextRecovery = await page.evaluate(async () => {
    const gl = document.querySelector('.world-canvas').getContext('webgl');
    const extension = gl.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    const canvas = gl.canvas;
    await new Promise(resolve => {
      canvas.addEventListener('webglcontextlost', resolve, { once: true });
      extension.loseContext();
    });
    await new Promise(resolve => setTimeout(resolve, 100));
    await new Promise(resolve => {
      canvas.addEventListener('webglcontextrestored', resolve, { once: true });
      extension.restoreContext();
    });
    return true;
  });
  await delay(500);
  check('GPU context restoration resumes rendered frames', initialContextRecovery && !(await stats(page)).contextLost && (await stats(page)).frames > 0);
  await shot(page, "world-meadow");
  await page.locator(".world-canvas").focus();
  const start = await stats(page);
  await page.keyboard.down("w"); await delay(550); await page.keyboard.up("w");
  if (!((await stats(page)).position.z < start.position.z - 1)) console.log("Movement diagnostic", JSON.stringify({ start, end: await stats(page), focus: await page.evaluate(() => ({ tag: document.activeElement.tagName, cls: document.activeElement.className, dialog: document.querySelector('#worldDialog').open, bindings: Engine.state.expedition.settings.bindings })) }));
  check("real keyboard input moves the explorer", (await stats(page)).position.z < start.position.z - 1);
  await page.keyboard.down("w"); await delay(150); await page.locator("#worldDifficulty").focus(); await page.keyboard.up("w");
  const released = await stats(page); await delay(250);
  check("releasing a key over a form does not leave movement held", Math.abs((await stats(page)).position.z - released.position.z) < 0.2);
  await page.evaluate(() => { window.testPad = { axes: [0,0,0,0], buttons: [{pressed:false},{pressed:false},{pressed:false}] }; Object.defineProperty(navigator,"getGamepads",{configurable:true,value:()=>window.testPad ? [window.testPad] : []}); });
  const beforePadKeyboard = (await stats(page)).position.z;
  await page.locator(".world-canvas").focus(); await page.keyboard.down("w"); await delay(300); await page.keyboard.up("w");
  check("idle gamepad does not override keyboard movement", (await stats(page)).position.z < beforePadKeyboard);
  await page.evaluate(() => { window.testPad.axes[1] = -1; }); await delay(200); await page.evaluate(() => { window.testPad = null; });
  const disconnected = await stats(page); await delay(200); check("gamepad disconnect clears its movement", Math.abs((await stats(page)).position.z - disconnected.position.z) < 0.2);
  await page.locator("#worldDifficulty").blur(); await page.locator(".world-canvas").focus();
  await page.keyboard.down(" "); await delay(150); check("Space starts a gravity-driven jump", (await stats(page)).lift > 0); await page.keyboard.up(" "); await delay(1500); check("jump lands back on terrain", (await stats(page)).lift === 0);
  const pose = (await stats(page)).position;
  await page.locator("#worldMapButton").click(); await page.keyboard.down("w"); await delay(250); await page.keyboard.up("w");
  check("map pauses locomotion", Math.abs((await stats(page)).position.z - pose.z) < 0.1);
  await shot(page, "world-map"); await page.getByRole("button", { name: "Close map", exact: true }).click();
  await lab(page, "bridge");
  await page.locator("#worldPrediction").fill("1000001"); await page.locator("#worldRun").click();
  check("out-of-range prediction shows an error without recording an attempt", (await page.locator("#worldPrediction").getAttribute("aria-invalid")) === "true" && (await state(page)).expedition.attempts.length === 0);
  await page.locator("#worldPrediction").fill("11");
  await page.locator("#worldRun").click();
  check("unsuccessful experiment records learning without credit", (await state(page)).xp === 0 && (await state(page)).expedition.attempts.length === 1);
  check("unsuccessful attempt preserves prediction and reports actual outcome", (await state(page)).expedition.attempts[0].prediction === 11 && (await page.locator("#worldResult .world-prediction-evidence").innerText()).includes("observed 10 m"));
  await setValues(page, { length: 10 }); await page.locator("#worldRun").click();
  check("successful experiment opens reflection", await page.locator("[data-reflection]").count() === 3);
  check("successful test saves trial and prediction before explanation", (await state(page)).expedition.attempts.at(-1).success && (await state(page)).expedition.attempts.at(-1).prediction === 11 && !(await state(page)).expedition.completed["bridge:standard"]);
  await page.locator("#worldPrediction").fill("12");
  check("changing prediction invalidates pending explanation", await page.locator("[data-reflection]").count() === 0);
  await page.locator("#worldRun").click();
  await setValues(page, { length: 9 });
  check("changing a result invalidates pending reflection", await page.locator("[data-reflection]").count() === 0);
  await page.getByRole("button", { name: "Leave experiment", exact: true }).click();
  await page.locator("#worldJournalButton").click();
  check("abandoned successful trial remains in the field notebook", (await page.locator(".world-journal").innerText()).includes("EXPERIMENT WORKED") && (await page.locator(".world-journal").innerText()).includes("Predicted 12 m"));
  await page.getByRole("button", { name: "Close field notes", exact: true }).click();
  const ids = await page.evaluate(() => Expedition.experiments.map(station => station.id));
  for (const difficulty of ["standard", "beginner", "advanced"]) {
    await page.locator("#worldDifficulty").selectOption(difficulty);
    for (const id of ids) { await solve(page, id, difficulty, id === "bridge" && difficulty === "standard"); }
  }
  check("all 18 field discoveries award exactly their first-completion total", (await state(page)).xp === 1500);
  const beforeReplay = (await state(page)).xp; await solve(page, "bridge", "advanced");
  check("replaying a discovery cannot farm XP", (await state(page)).xp === beforeReplay);
  await page.locator("#worldDifficulty").selectOption("standard");
  await lab(page, "projectile"); await setValues(page, await page.evaluate(() => Expedition.sampleSolution("projectile")));
  await page.locator("#worldRun").click(); await delay(650); await shot(page, "world-projectile");
  await page.getByRole("button", { name: "Leave experiment", exact: true }).click();
  await page.locator("#worldJournalButton").click(); check("field journal includes experiment evidence", (await page.locator("#worldDialog").innerText()).includes("The missing span"));
  check("field notes show prediction comparisons and measured metrics", await page.locator(".world-journal .world-prediction-evidence").count() > 0 && await page.locator(".world-journal .world-metrics").count() > 0);
  await shot(page, "world-journal");
  await page.locator('[data-retest="bridge"]').first().click();
  check("field notebook reopens the original challenge level", (await page.locator("#worldDialogTitle").innerText()).includes("missing span") && (await state(page)).expedition.settings.difficulty === "advanced");
  await page.getByRole("button", { name: "Leave experiment", exact: true }).click();
  await page.locator("#worldSettingsButton").click();
  await page.locator('[data-binding="forward"]').click(); await page.keyboard.press("Tab");
  check("key remapping allows Tab to leave capture", await page.locator('[data-binding="forward"]').evaluate(node => document.activeElement !== node));
  await page.locator('[data-binding="forward"]').click(); await page.keyboard.press("z");
  await page.locator("#worldMotion").check(); await page.locator("#worldApplySettings").click();
  check("custom controls and reduced motion persist", (await state(page)).expedition.settings.bindings.forward === "z" && (await state(page)).expedition.settings.reducedMotion);
  await page.locator(".world-canvas").focus();
  const beforeZ = (await stats(page)).position.z; await page.keyboard.down("z"); await delay(350); await page.keyboard.up("z"); check("remapped movement works", (await stats(page)).position.z < beforeZ);
  const backup = await page.evaluate(() => Engine.exportJSON());
  await page.reload(); await page.locator(".world-canvas").waitFor(); await delay(1000);
  check("cold reload restores 18 discoveries and XP without onboarding", Object.keys((await state(page)).expedition.completed).length === 18 && (await state(page)).xp === 1500 && await page.locator("#worldStart").count() === 0);
  check("cold reload retains prediction evidence", (await state(page)).expedition.attempts.some(attempt => attempt.prediction === 1));
  await page.evaluate(backup => { Engine.reset(); Engine.importJSON(backup); }, backup);
  await page.reload(); await page.locator(".world-canvas").waitFor();
  check("Atlas export/import includes world progress", Object.keys((await state(page)).expedition.completed).length === 18 && (await state(page)).xp === 1500);
  check("Atlas backup round trip retains prediction evidence", (await state(page)).expedition.attempts.some(attempt => attempt.prediction === 1));
  const samples = [];
  for (let i = 0; i < 12; i++) { await delay(200); samples.push(await stats(page)); }
  report.performance.webgl = { samples: samples.length, medianFPS: samples.map(s => s.fps).sort((a,b)=>a-b)[6], meanRenderMs: samples.reduce((sum,s)=>sum+s.renderMs,0)/samples.length, maxTriangles: Math.max(...samples.map(s=>s.triangles)), maxDrawCalls: Math.max(...samples.map(s=>s.drawCalls)) };
  check("WebGL mesh stays within 22k triangles and 3 draw calls", report.performance.webgl.maxTriangles < 22000 && report.performance.webgl.maxDrawCalls <= 3);
  for (const route of ["home", "learn", "play", "journey", "study", "arena", "data", "frontier", "passport", "settings"]) {
    await page.evaluate(route => { location.hash = route; }, route); await page.locator(`#view-${route}.is-active`).waitFor();
    check(`existing ${route} route renders`, (await page.locator(`#view-${route}`).innerText()).length > 50);
    check(`world loop stops on ${route}`, await stats(page) === null);
  }
  await page.evaluate(() => { location.hash = "world"; }); await page.locator(".world-canvas").waitFor();
  check("return to world creates one canvas", await page.locator("#worldHost .world-canvas").count() === 1);
  await shot(page, "world-restored");
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }); observe(mobile);
  await mobile.goto(origin + "/#world"); await mobile.locator("#worldStart").click(); await delay(600);
  check("mobile layout stays within viewport", await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  const beforeTouch = await stats(mobile); const box = await mobile.locator('[data-action="forward"]').boundingBox();
  await mobile.mouse.move(box.x + box.width/2, box.y + box.height/2); await mobile.mouse.down(); await delay(450); await mobile.mouse.up();
  check("touch-style pointer hold moves player", (await stats(mobile)).position.z < beforeTouch.position.z);
  const afterTouch = await stats(mobile); await delay(250);
  check("releasing touch control stops movement", Math.abs((await stats(mobile)).position.z - afterTouch.position.z) < 0.2);
  await shot(mobile, "world-mobile"); await solve(mobile, "garden", "standard");
  check("mobile supports a complete experiment and explanation", !!(await state(mobile)).expedition.completed["garden:standard"]);
  await mobile.close();
  await page.close();
  const fallback = await browser.newPage({ viewport: { width: 1280, height: 800 } }); observe(fallback);
  await fallback.goto(origin + "/?renderer=canvas#world"); await fallback.locator("#worldStart").click(); await delay(800);
  check("Canvas 2D fallback creates the world without WebGL", (await stats(fallback)).renderer === "Canvas 2D");
  for (const id of ids) await solve(fallback, id, "standard"); await shot(fallback, "world-canvas-fallback");
  check("fallback supports complete experiment and reflection", !!(await state(fallback)).expedition.completed["energy:standard"]);
  await delay(1500);
  const fallbackSamples=[];for(let i=0;i<10;i++){await delay(250);fallbackSamples.push(await stats(fallback));}
  report.performance.canvas = { samples: fallbackSamples.length, isolated: true, medianFPS: fallbackSamples.map(s=>s.fps).sort((a,b)=>a-b)[5], meanRenderMs: fallbackSamples.reduce((sum,s)=>sum+s.renderMs,0)/fallbackSamples.length };
  report.performance.gates = { webgl30FPS: report.performance.webgl.medianFPS >= 30, canvas20FPS: report.performance.canvas.medianFPS >= 20 };
  await fallback.close();
  const recovery = await browser.newPage({ viewport: { width: 1280, height: 800 } }); observe(recovery);
  await recovery.addInitScript(() => { localStorage.setItem("atlas.state.v1", JSON.stringify({ xp: 0, worldIntroSeen: true, expedition: { version:1, position:{x:-30,z:10,yaw:0},completed:{"bridge:standard":{at:1,values:{length:1}}} } })); });
  await recovery.goto(origin + "/#world"); await recovery.locator(".world-canvas").waitFor(); await delay(300);
  check("invalid bridge save recovers water spawn to safe ground", (await stats(recovery)).position.x === 0 && (await stats(recovery)).position.z === 28);
  const contextRecovery = await recovery.evaluate(async () => {
    const canvas=document.querySelector(".world-canvas"), gl=canvas.getContext("webgl"), extension=gl.getExtension("WEBGL_lose_context");
    if(!extension)return null;
    let restored=false;canvas.addEventListener("webglcontextrestored",()=>restored=true,{once:true});extension.loseContext();await new Promise(resolve=>setTimeout(resolve,150));extension.restoreContext();await new Promise(resolve=>setTimeout(resolve,350));return restored;
  });
  check("GPU context restoration rebuilds rendering", contextRecovery === true && !(await stats(recovery)).contextLost);
  await recovery.close();
  const unavailable = await browser.newPage({ viewport: { width: 1000, height: 800 } }); observe(unavailable);
  await unavailable.addInitScript(() => { Storage.prototype.setItem = function(){throw new DOMException("Full", "QuotaExceededError")}; });
  await unavailable.goto(origin + "/#world"); await unavailable.locator("#worldStart").click(); await unavailable.locator("#worldMapButton").click();
  check("storage failure visibly reports session-only progress", (await unavailable.locator("#worldSave").textContent()).includes("Session only"));
  await unavailable.getByRole("button", { name: "Close map", exact: true }).click();
  await unavailable.evaluate(() => { location.hash = "settings"; }); await unavailable.locator("#impData").waitFor({ state: "attached" });
  await unavailable.locator("#impData").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from('{"xp":120}') });
  await unavailable.getByText("Backup restored in this session only. Storage is unavailable; export before closing.", { exact: true }).waitFor();
  check("backup UI reports session-only restore when storage is blocked", (await state(unavailable)).xp === 120);
  await unavailable.close();
  const shared = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const tabA = await shared.newPage(), tabB = await shared.newPage(); observe(tabA); observe(tabB);
  await tabA.goto(origin + "/#world"); await tabA.locator("#worldStart").click();
  await tabB.goto(origin + "/#world"); await tabB.locator(".world-canvas").waitFor();
  await solve(tabA, "bridge", "standard");
  const latestStored = await tabA.evaluate(() => localStorage.getItem("atlas.state.v1"));
  const rejected = await tabB.evaluate(() => ({ saved: Engine.save(), reason: Engine.saveIssue }));
  check("stale second browser tab refuses to overwrite a new completion", !rejected.saved && rejected.reason === "conflict" && await tabB.evaluate(() => localStorage.getItem("atlas.state.v1")) === latestStored);
  await tabB.locator("#worldMapButton").click(); await tabB.getByRole("button", { name: "Close map", exact: true }).click();
  check("stale-tab conflict is visible with export recovery guidance", (await tabB.locator("#worldSave").textContent()).includes("Another tab saved"));
  await tabB.evaluate(() => { location.hash = "settings"; }); await tabB.locator("#impData").waitFor({ state: "attached" });
  const liveBeforeInvalid = await tabB.evaluate(() => Engine.exportJSON());
  await tabB.locator("#impData").setInputFiles({ name: "bad-backup.json", mimeType: "application/json", buffer: Buffer.from('{"xp":0,"settings":null}') });
  await tabB.getByText("⚠️ That file isn't a valid Atlas backup. Your existing progress was kept.", { exact: true }).waitFor();
  check("invalid backup UI preserves live and stored progress", await tabB.evaluate(() => Engine.exportJSON()) === liveBeforeInvalid && await tabB.evaluate(() => localStorage.getItem("atlas.state.v1")) === latestStored);
  await shared.close();
  check("full journeys have zero browser console/page errors", report.errors.length === 0);
  check("the game makes no third-party requests", report.externalRequests.length === 0);
  report.status = Object.values(report.performance.gates).every(Boolean) ? "passed" : "functional-passed-with-open-performance-gates";
} catch (error) { report.status = "failed"; report.failure = error.stack; throw error; }
finally { await writeFile(evidence + "world-browser.json", JSON.stringify(report,null,2)+"\n"); await browser.close(); await new Promise(resolve=>server.close(resolve)); }
