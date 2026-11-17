(function (global) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const normAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
  const STEP = 1 / 60, BOUNDS = 100;
  const DEFAULT_BINDINGS = { forward: "w", back: "s", left: "a", right: "d", turnL: "arrowleft", turnR: "arrowright", jump: " ", interact: "e", sprint: "shift" };
  function navigationTo(player, destination) {
    const dx = destination.x - player.x, dz = destination.z - player.z;
    const bearing = Math.atan2(dx, -dz);
    const heading = (bearing * 180 / Math.PI + 360) % 360;
    const relative = normAngle(bearing - player.yaw) * 180 / Math.PI;
    const distance = Math.hypot(dx, dz);
    const direction = distance < 11 ? "You have arrived" : Math.abs(relative) <= 15 ? "Straight ahead" : Math.abs(relative) >= 165 ? "Turn around" : relative > 0 ? "Turn right" : "Turn left";
    return { distance, bearing: heading, relative, compass: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(heading / 45) % 8], direction };
  }
  function terrainHeight(x, z) {
    return 0.55 * Math.sin(x * 0.09 + 0.3) + 0.5 * Math.cos(z * 0.08 - 0.4) + 0.22 * Math.sin((x + z) * 0.05);
  }
  function project(x, y, z, cam, vp) {
    const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
    const depth = dx * Math.sin(cam.yaw) - dz * Math.cos(cam.yaw);
    const lateral = dx * Math.cos(cam.yaw) + dz * Math.sin(cam.yaw);
    if (depth <= 0.4) return { x: 0, y: 0, depth, visible: false };
    return { x: vp.cx + lateral * vp.focal / depth, y: vp.cy + (cam.pitch || 0) * vp.focal - dy * vp.focal / depth, depth, visible: true };
  }
  function walkable(x, z, completed) {
    if (Math.abs(x) > BOUNDS || Math.abs(z) > BOUNDS) return false;
    const river = Math.abs(x + 30) < 5 && z > -35 && z < 45;
    return !river || (completed.includes("bridge") && Math.abs(z - 10) < 3);
  }
  function stepPlayer(player, keys, dt, completed = [], colliders = []) {
    dt = clamp(dt, 0, STEP);
    player.yaw = normAngle(player.yaw + ((keys.turnR ? 1 : 0) - (keys.turnL ? 1 : 0)) * 1.8 * dt);
    let forward = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0);
    let side = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const length = Math.hypot(forward, side);
    if (length) { forward /= length; side /= length; }
    const speed = keys.sprint ? 13 : 7;
    const dx = (Math.sin(player.yaw) * forward + Math.cos(player.yaw) * side) * speed * dt;
    const dz = (-Math.cos(player.yaw) * forward + Math.sin(player.yaw) * side) * speed * dt;
    const nx = clamp(player.x + dx, -BOUNDS, BOUNDS), nz = clamp(player.z + dz, -BOUNDS, BOUNDS);
    const available = (x, z) => walkable(x, z, completed) && colliders.every(collider => Math.hypot(x - collider.x, z - collider.z) >= collider.r + 0.35);
    if (available(nx, player.z)) player.x = nx;
    if (available(player.x, nz)) player.z = nz;
    player.lift = player.lift || 0; player.vy = player.vy || 0;
    if (keys.jump && player.lift === 0 && !player.jumpHeld) player.vy = 5.8;
    player.jumpHeld = !!keys.jump;
    player.vy -= 9.81 * dt; player.lift = Math.max(0, player.lift + player.vy * dt);
    if (player.lift === 0) player.vy = 0;
    player.y = terrainHeight(player.x, player.z) + 2.4 + player.lift;
    return player;
  }
  function mountWorld(container, cfg = {}) {
    const stations = cfg.stations || [], keys = Object.create(null);
    const spawn = cfg.spawn || { x: 0, z: 28, yaw: 0 };
    const cam = { x: clamp(spawn.x, -BOUNDS, BOUNDS), z: clamp(spawn.z, -BOUNDS, BOUNDS), yaw: normAngle(spawn.yaw || 0), pitch: 0, lift: 0, vy: 0 };
    if (!walkable(cam.x, cam.z, cfg.completed || [])) { cam.x = 0; cam.z = 28; cam.yaw = 0; }
    cam.y = terrainHeight(cam.x, cam.z) + 2.4;
    let previous = { ...cam };
    const canvas = document.createElement("canvas");
    canvas.className = "world-canvas"; canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Atlas open world. Move with WASD, turn with arrows, jump with Space, and interact with E. Alternative station access is in the map.");
    container.appendChild(canvas);
    const renderer = global.AtlasRenderer.create(canvas, { quality: cfg.quality || "auto", reduced: cfg.reduced, forceCanvas: cfg.forceCanvas });
    const scene = { time: 0, completed: cfg.completed || [], experiment: null, pulses: [], stations, beacon: cfg.beacon || null };
    let running = false, paused = false, raf = 0, last = 0, accumulator = 0, nearest = null, nearId = "", observer;
    let focusCam = null, drag = null, hudClock = 0, pulseClock = 0, frames = 0, fps = 0, fpsClock = 0, elapsed = 0, simSteps = 0, padInteractHeld = false;
    const bindings = { ...DEFAULT_BINDINGS, ...cfg.bindings };
    function resize() { renderer.resize(Math.max(240, container.clientWidth), Math.max(240, container.clientHeight), Math.min(cfg.quality === "low" ? 1 : 1.5, global.devicePixelRatio || 1)); }
    function clearKeys() { for (const key of Object.keys(keys)) keys[key] = false; drag = null; }
    function updateProximity() {
      nearest = stations.map(station => ({ ...station, distance: Math.hypot(station.x - cam.x, station.z - cam.z) })).filter(station => station.distance < 11).sort((a, b) => a.distance - b.distance)[0] || null;
      if ((nearest ? nearest.id : "") !== nearId) { nearId = nearest ? nearest.id : ""; cfg.onNear?.(nearest); }
    }
    function activate() { if (!paused && nearest && cfg.onEnter) { clearKeys(); cfg.onEnter(nearest); } }
    function setKey(action, down) {
      if (action === "interact" && down && !keys.interact) activate();
      keys[action] = !!down;
    }
    function frame(now) {
      if (!running) return;
      const delta = last ? clamp((now - last) / 1000, 0, 0.1) : 0; last = now;
      if (!document.hidden) {
        elapsed += delta; fpsClock += delta; frames++;
        if (fpsClock >= 1) { fps = Math.round(frames / fpsClock); frames = 0; fpsClock = 0; }
        scene.time += delta;
        if (scene.experiment) scene.experiment.elapsed += delta;
        if (!paused) {
          const pad = global.navigator.getGamepads && Array.from(global.navigator.getGamepads()).find(Boolean);
          const padKeys = pad ? { forward: pad.axes[1] < -0.2, back: pad.axes[1] > 0.2, left: pad.axes[0] < -0.2, right: pad.axes[0] > 0.2, turnL: pad.axes[2] < -0.2, turnR: pad.axes[2] > 0.2, jump: !!pad.buttons[0]?.pressed } : {};
          if (pad) {
            if (pad.buttons[2]?.pressed && !padInteractHeld) activate();
            padInteractHeld = !!pad.buttons[2]?.pressed;
          }
          else padInteractHeld = false;
          const input = Object.fromEntries(Object.keys(DEFAULT_BINDINGS).map(action => [action, !!keys[action] || !!padKeys[action]]));
          accumulator = Math.min(accumulator + delta, STEP * 5);
          while (accumulator >= STEP) { previous = { ...cam }; stepPlayer(cam, input, STEP, scene.completed, renderer.colliders); accumulator -= STEP; simSteps++; }
          updateProximity(); pulseClock += delta;
          if (!cfg.reduced && (keys.forward || keys.back || keys.left || keys.right) && pulseClock > 0.6) { scene.pulses.push({ x: cam.x, z: cam.z, t: 0 }); pulseClock = 0; }
        }
        for (const pulse of scene.pulses) pulse.t += delta;
        scene.pulses = scene.pulses.filter(pulse => pulse.t < 1.4).slice(-4);
        const alpha = accumulator / STEP;
        const view = focusCam || { ...cam, x: lerp(previous.x, cam.x, alpha), y: lerp(previous.y, cam.y, alpha), z: lerp(previous.z, cam.z, alpha) };
        renderer.render(view, scene);
        hudClock += delta;
        if (hudClock > 0.2) { hudClock = 0; cfg.onUpdate?.({ cam: { ...cam }, nearest, fps, elapsed, renderer: renderer.type }); }
      } else accumulator = 0;
      raf = requestAnimationFrame(frame);
    }
    function keyEvent(event, down) {
      const key = event.key.toLowerCase();
      const action = Object.keys(bindings).find(action => bindings[action] === key);
      if (!down && action) { setKey(action, false); return; }
      if (event.target.closest?.("input,textarea,select,button,a,[contenteditable=true],dialog[open]")) return;
      if (down && key === "escape" && cfg.onPause) { clearKeys(); cfg.onPause(); return; }
      if (paused) return;
      if (action) { event.preventDefault(); if (!event.repeat || action !== "interact") setKey(action, down); }
    }
    const keyDown = event => keyEvent(event, true), keyUp = event => keyEvent(event, false);
    function pointerDown(event) { if (!paused && event.button === 0) { canvas.focus(); canvas.setPointerCapture(event.pointerId); drag = { x: event.clientX, y: event.clientY }; } }
    function pointerMove(event) {
      if (!drag || paused) return;
      cam.yaw = normAngle(cam.yaw + (event.clientX - drag.x) * 0.004);
      cam.pitch = clamp(cam.pitch - (event.clientY - drag.y) * 0.002, -0.5, 0.65);
      drag = { x: event.clientX, y: event.clientY };
    }
    const pointerUp = () => { drag = null; };
    function visibility() { clearKeys(); last = 0; accumulator = 0; }
    function start() {
      if (running) return;
      running = true; resize(); updateProximity();
      global.addEventListener("keydown", keyDown); global.addEventListener("keyup", keyUp);
      global.addEventListener("blur", clearKeys); document.addEventListener("visibilitychange", visibility);
      canvas.addEventListener("pointerdown", pointerDown); canvas.addEventListener("pointermove", pointerMove);
      canvas.addEventListener("pointerup", pointerUp); canvas.addEventListener("pointercancel", pointerUp); canvas.addEventListener("lostpointercapture", pointerUp);
      if (global.ResizeObserver) { observer = new ResizeObserver(resize); observer.observe(container); }
      else global.addEventListener("resize", resize);
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false; cancelAnimationFrame(raf); clearKeys(); observer?.disconnect();
      global.removeEventListener("keydown", keyDown); global.removeEventListener("keyup", keyUp);
      global.removeEventListener("blur", clearKeys); global.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      renderer.dispose(); canvas.remove();
    }
    function pause(value) { paused = value; clearKeys(); accumulator = 0; previous = { ...cam }; }
    function focus(station) {
      focusCam = station ? { x: station.x + (station.id === "projectile" ? 30 : 13), z: station.z + (station.id === "projectile" ? 32 : 20), y: terrainHeight(station.x, station.z) + (station.id === "projectile" ? 17 : 11), yaw: -0.55, pitch: -0.3, offsetX: -0.25 } : null;
    }
    function travel(station) {
      cam.x = clamp(station.x + 7, -BOUNDS, BOUNDS); cam.z = clamp(station.z + 7, -BOUNDS, BOUNDS);
      if (!walkable(cam.x, cam.z, scene.completed)) cam.x = station.x + 12;
      cam.yaw = -Math.PI / 4; cam.pitch = 0; cam.lift = 0; cam.vy = 0;
      cam.y = terrainHeight(cam.x, cam.z) + 2.4; previous = { ...cam }; updateProximity();
    }
    function snapshot() { return { x: cam.x, z: cam.z, yaw: cam.yaw }; }
    function stats() { return { ...renderer.stats(), fps, simSteps, elapsed, paused, position: snapshot(), lift: cam.lift }; }
    return { start, stop, pause, focus, travel, setKey, snapshot, stats, cam, nearest: () => nearest, bindings, canvas,
      setExperiment(experiment) { scene.experiment = experiment ? { ...experiment, elapsed: 0 } : null; },
      setCompleted(ids) { scene.completed = ids; }, setBeacon(station) { scene.beacon = station; } };
  }
  global.World3D = { mountWorld, project, terrainHeight, navigationTo, clamp, lerp, normAngle, stepPlayer, walkable, STEP, BOUNDS, DEFAULT_BINDINGS };
})(typeof window !== "undefined" ? window : globalThis);
