# Open-world verification — 2026-11-17

## Release preparation verification — 2026-11-17

Fresh evidence is in `docs/.docs/evidence/2026-11-17-release/world-browser.json`. All 208 functional browser checks passed with zero console/page errors and zero third-party requests. The separate Node renderer suite passed all seven tests, including WebGL/Canvas labs and GPU context recovery. The standard Bun suite passed 30 tests; its optional browser smoke was skipped and exercised separately with Node. Syntax checks and the 27-guide documentation freshness gate passed.

Headless Chromium on this workstation measured WebGL median 57 FPS, mean render submission 14.99 ms, maximum 20,577 triangles and three draws in the full-app sample. Canvas measured median 13 FPS and mean render submission 32.65 ms, below its 20 FPS traversal target. These measurements are reference-host evidence, not school-device benchmarks. The run remains `functional-passed-with-open-performance-gates`.

The public Pages package was checked separately: 105 filesystem entries and 271 valid local HTML references, with development directories and QA images excluded. Mobile screenshot inspection found no horizontal overflow. Broad screen-reader, browser and representative hardware acceptance remain open as listed below. The November 12 results below are retained as historical context.

The first playable expedition is implemented. Functional acceptance is distinct from performance and educational release acceptance.

## Evidence sources

- `tests/world.test.cjs`: existing projection and curriculum-generator contracts.
- `tests/expedition.test.mjs`: eighteen attainable missions, physical invariants, malformed inputs, bounded/corrupt saves and idempotent rewards.
- `tests/engine-persistence.test.mjs`: malformed backup rejection, nested defaults, stale-tab write rejection and session-only restoration.
- `tests/renderer-regions.test.mjs`: regional geometry budgets, path and laboratory sightlines, and reactive turbine behaviour. Its browser smoke is optional when tooling is configured.
- `tests/world-runtime.test.mjs`: movement normalisation, fixed-step bounds, jumping, bridge/water traversal and tree collision.
- `scripts/verify-world-browser.mjs`: complete real-browser journeys and captured evidence.
- `docs/.docs/evidence/2026-11-12-bun/world-browser.json`: latest full-app results and screenshot paths after the Bun migration. Earlier evidence directories are retained.

## Completed checks

The latest full-app run passes 208 checks. All eighteen station/difficulty combinations complete through the browser UI and preserve prediction evidence. Trials, including successful ones, save immediately. Discovery and XP wait for a correct explanation; a wrong explanation earns no XP. Changed parameters or predictions invalidate pending explanation. Total first-completion reward is exactly 1,500 XP; replay gives zero. A mobile garden experiment and all six standard Canvas-fallback experiments reach explanation and completion.

Bun 1.3.14 serves the local application, executes syntax and unit checks, rebuilds documentation and runs the CI commands. Thirty Bun unit checks pass; the optional renderer browser smoke is skipped by the Bun runner on Windows and is available through `bun run test:renderer:browser`. Full browser verification runs with Node 24.11.1 internally through `bun run test:browser`: Playwright's Windows debugging-pipe launch timed out under Bun. The bridge preview now scales the actual brace to the selected length, including when revisiting a restored bridge. All 18 render fixtures use valid physical results and verify that controls change geometry.

Actual keyboard input moves the focused canvas; Space activates focused toolbar buttons and jumps when playing. Releasing over a select clears held movement. Map dialogs pause locomotion, and tracking changes the destination without teleporting. Pointer-down/up touch controls move and stop. Remapped controls and reduced motion survive reload. Progress and predictions survive cold reload and Atlas backup import. Ten existing Atlas routes render; leaving them stops the world and returning creates a single canvas.

The report captures zero console/page errors and zero third-party requests. GPU context-loss and restoration rebuild the scene. Real browser tabs sharing storage prove that a stale save cannot overwrite a newer bridge completion and XP. The conflict message offers export recovery. Invalid backup upload preserves both live and persisted state; storage-blocked restoration displays session-only status. Each new region has been inspected in generated screenshots; geometry tests cover clearance and the 22k-triangle maximum.

## Remaining gates

The reference browser is headless Chromium using SwiftShader on this Windows workstation. Latest full-app WebGL samples measured 48 FPS median, 12.07 ms mean render submission, 20,577 triangles and three draws. Stress geometry reaches 21,903 triangles. These meet the slice's 30 FPS / 22k triangles / three-draw reference budget. Submission time is not total GPU frame time. These are not school-hardware benchmarks.

Latest isolated Canvas fallback samples measured 14 FPS median and 29.16 ms mean render submission. Its 20 FPS traversal target remains unmet. Functional alternative access and all six standard experiments are proven; smooth fallback traversal must not be claimed. The full run is labelled **functional-passed-with-open-performance-gates**.

Still unverified: Safari/Firefox, representative school laptops/tablets, physical gamepads, screen-reader-led play, real learner usability and measured learning gains. Scene composition has been inspected through generated browser screenshots; broader environmental quality remains a future art milestone.
