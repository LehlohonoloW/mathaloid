(function (global) {
  "use strict";
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icons = { bridge: "i-route", projectile: "i-target", balance: "i-scale", energy: "i-zap", waves: "i-atom", garden: "i-shapes" };
  const symbol = id => `<svg class="ic" aria-hidden="true"><use href="#${icons[id] || "i-compass"}"/></svg>`;
  const keyLabel = key => ({ " ": "Space", arrowleft: "←", arrowright: "→", arrowup: "↑", arrowdown: "↓", shift: "Shift" }[key] || key.toUpperCase());
  function metricRows(id, metrics, values) {
    const definitions = {
      bridge: [["Horizontal span", metrics.span, "m"], ["Vertical support", metrics.rise, "m"], ["Required diagonal", metrics.required, "m"], ["Your brace", values.length, "m"]],
      projectile: [["Landing distance", metrics.range, "m"], ["Target distance", metrics.target, "m"], ["Time in flight", metrics.flight, "s"], ["Maximum height", metrics.peak, "m"]],
      balance: [["Left torque", metrics.leftTorque, "N·m"], ["Right torque", metrics.rightTorque, "N·m"], ["Net torque", metrics.netTorque, "N·m"]],
      energy: [["Starting energy", metrics.potential, "J"], ["Kinetic energy", metrics.kinetic, "J"], ["Final speed", metrics.speed, "m/s"], ["Energy retained", metrics.retention * 100, "%"]],
      waves: [["Signal speed", metrics.speed, "m/s"], ["Frequency", values.frequency, "Hz"], ["Wavelength", values.wavelength, "m"]],
      garden: [["Growing area", metrics.area, "m²"], ["Fencing needed", metrics.perimeter, "m"], ["Target area", metrics.target, "m²"]]
    };
    return (definitions[id] || []).filter(([, value]) => Number.isFinite(value)).map(([label, value, unit]) => `<div><dt>${label}</dt><dd>${Number(value.toFixed(2))} <small>${unit}</small></dd></div>`).join("");
  }

  function mount(el, cfg) {
    let progress = Expedition.sanitizeProgress(cfg.getProgress());
    let world, disposed = false, lastSave = 0, pending = null, experiment = null, hintStep = 0, returnFocus = null;
    let hasStarted = cfg.introSeen, trackedId = null;
    const completedIds = () => [...new Set(Object.keys(progress.completed).map(key => key.split(":")[0]))];
    const tier = () => progress.settings.difficulty;
    const solved = id => !!progress.completed[`${id}:${tier()}`];
    const next = () => Expedition.experiments.find(station => !solved(station.id));
    const destination = () => Expedition.experiments.find(station => station.id === trackedId) || next();
    const $ = selector => el.querySelector(selector);
    const all = selector => [...el.querySelectorAll(selector)];
    function persist() {
      if (world) progress.position = world.snapshot();
      cfg.setProgress(progress);
      const saved = cfg.onSave();
      const node = $("#worldSave");
      if (node) { node.textContent = saved === false ? cfg.saveIssue?.() === "conflict" ? "Another tab saved · export this session" : "Session only · export to keep" : "Saved on this device"; node.classList.toggle("save-warning", saved === false); }
    }

    el.innerHTML = `<div class="expedition-shell">
      <div class="expedition-titlebar"><div><span class="expedition-kicker">MATHALOID / FIELD EXPEDITION</span><h1>The Atlas Plateau<span>A living laboratory</span></h1></div>
        <div class="expedition-toolbar"><label class="world-level">Challenge <select id="worldDifficulty" aria-label="Experiment difficulty"><option value="beginner">Discover</option><option value="standard">Investigate</option><option value="advanced">Engineer</option></select></label><button class="world-tool" id="worldMapButton">${symbol("bridge")} Map <kbd>M</kbd></button><button class="world-tool" id="worldJournalButton">${symbol("garden")} Field notes</button><button class="world-tool" id="worldSettingsButton" aria-label="Pause and expedition settings"><svg class="ic"><use href="#i-gear"/></svg></button></div>
      </div>
      <div class="expedition-stage" id="worldHost">
        <div class="world-hud world-objective"><span class="world-eyebrow">YOUR NEXT DISCOVERY</span><h2 id="worldObjectiveName"></h2><p id="worldObjectiveText"></p><div class="world-navigation" id="worldNavigation"></div><button id="worldTrack" class="world-text-button">Find it on the map →</button><div class="world-progress"><span id="worldProgressBar"></span></div><small id="worldProgressText"></small></div>
        <div class="world-hud world-location"><span class="world-eyebrow" id="worldRegion">Observatory meadow</span><canvas id="worldMinimap" width="164" height="164" aria-label="Map of the six experiments; use the Map button for accessible navigation"></canvas><span id="worldCoordinates">0 E · 28 N</span></div>
        <div class="world-reticle" aria-hidden="true">+</div>
        <div class="world-hud world-near" id="worldNear" hidden><span id="worldNearName"></span><button class="world-action" id="worldInteract">Investigate <kbd>E</kbd></button></div>
        <div class="world-hud world-bottom"><span class="world-control-hint" id="worldControlHint"></span><span class="world-status"><span id="worldSave">Saved on this device</span><span class="world-render-info" id="worldRenderInfo"></span></span></div>
        <div class="world-touch" aria-label="Touch movement"><div class="world-dpad"><button data-action="forward" aria-label="Walk forward">↑</button><button data-action="left" aria-label="Strafe left">←</button><button data-action="back" aria-label="Walk backward">↓</button><button data-action="right" aria-label="Strafe right">→</button></div><div class="world-touch-actions"><button data-action="turnL" aria-label="Turn left">↶</button><button data-action="turnR" aria-label="Turn right">↷</button><button data-action="jump" aria-label="Jump">Jump</button></div></div>
      </div>
      <div class="expedition-caption"><p><b>Learn by changing the world.</b> Restore six field stations through maths and physics. Explore in any order.</p><a href="#learn">Open the learning atlas ↗</a></div>
      <dialog id="worldDialog" class="expedition-dialog" aria-labelledby="worldDialogTitle"></dialog>
    </div>`;

    const dialog = $("#worldDialog");
    const minimap = $("#worldMinimap");
    $("#worldDifficulty").value = tier();
    function refreshObjective() {
      const station = destination(), count = Expedition.experiments.filter(station => solved(station.id)).length;
      $("#worldObjectiveName").textContent = station ? station.name : "Plateau restored";
      $("#worldObjectiveText").textContent = station ? station.summary : "All six stations are working. Try a new challenge level or test another idea.";
      $("#worldProgressBar").style.width = `${count / 6 * 100}%`;
      $("#worldProgressText").textContent = `${count} / 6 stations restored · ${tier() === "beginner" ? "Discover" : tier() === "advanced" ? "Engineer" : "Investigate"}`;
      world?.setBeacon(station || null);
      $("#worldTrack").textContent = station ? "Find it on the map →" : "Explore all stations →";
      if (world) updateNavigation(world.cam);
    }
    function updateNavigation(cam) {
      const station = destination(), node = $("#worldNavigation");
      node.hidden = !station;
      if (!station) return;
      const route = World3D.navigationTo(cam, station);
      node.textContent = `${route.direction} · ${Math.round(route.distance)} m ${route.compass}`;
      node.title = "Straight-line distance. Follow the paths or go around the river until its bridge is restored.";
    }
    function trackStation(station) { trackedId = station.id; refreshObjective(); drawMap(world.cam); }
    function drawMap(cam) {
      const ctx = minimap.getContext("2d"), size = 164;
      const point = (x, z) => [size / 2 + x * 0.67, size / 2 + z * 0.67];
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#163f38"; ctx.beginPath(); ctx.arc(82, 82, 77, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#41918b"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(...point(-30, -35)); ctx.lineTo(...point(-30, 45)); ctx.stroke();
      ctx.strokeStyle = "rgba(238,222,160,.25)"; ctx.lineWidth = 1; ctx.beginPath();
      Expedition.experiments.forEach(station => { ctx.moveTo(...point(0, 0)); ctx.lineTo(...point(station.x, station.z)); }); ctx.stroke();
      for (const station of Expedition.experiments) {
        const [x, y] = point(station.x, station.z);
        if (station.id === destination()?.id) { ctx.strokeStyle = "#f5dda0"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = station.color; ctx.beginPath(); ctx.arc(x, y, solved(station.id) ? 5 : 3.5, 0, 7); ctx.fill();
        if (solved(station.id)) { ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x, y + 2); ctx.lineTo(x + 3, y - 2); ctx.stroke(); }
      }
      const [x, y] = point(cam.x, cam.z);
      ctx.save(); ctx.translate(x, y); ctx.rotate(cam.yaw); ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = "#cbe7db"; ctx.font = "10px system-ui"; ctx.textAlign = "center"; ctx.fillText("N", 82, 13);
    }
    function show(content, kind = "menu") {
      returnFocus = document.activeElement;
      world.pause(true);
      dialog.className = `expedition-dialog ${kind === "lab" ? "expedition-lab" : ""}`;
      dialog.innerHTML = content;
      if (!dialog.open) dialog.showModal();
      dialog.querySelector("button,input,select")?.focus();
      dialog.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => dialog.close()));
    }
    function resetExperiment() { experiment = null; pending = null; world?.focus(null); world?.setExperiment(null); }
    dialog.addEventListener("close", () => { resetExperiment(); world?.pause(false); persist(); (returnFocus?.isConnected ? returnFocus : world?.canvas)?.focus(); });
    function welcome() {
      show(`<div class="world-welcome"><span class="expedition-kicker">WELCOME, FIELD EXPLORER</span><h2 id="worldDialogTitle">A world worth<br>figuring out.</h2><p>A river needs a bridge. A lighthouse needs a signal. Your ideas can bring this plateau back to life.</p><div class="world-welcome-loop"><span>01 <b>Explore</b></span><span>02 <b>Experiment</b></span><span>03 <b>Explain</b></span></div><p class="world-welcome-tip">WASD to walk · arrows or drag to look · Space to jump.<br>No timer. No lost lives. Every attempt teaches you something.</p><button class="world-action world-start" id="worldStart">Start exploring <span>→</span></button><button class="world-text-button" id="worldAccessible">Explore using the station map</button><small>Maths + physics · 6 stations · 3 challenge levels<br>Your learning stays on this device.</small></div>`);
      $("#worldStart").addEventListener("click", () => { hasStarted = true; cfg.onIntro(); dialog.close(); cfg.onSound?.("start"); });
      $("#worldAccessible").addEventListener("click", () => { hasStarted = true; cfg.onIntro(); openMap(); });
    }
    function openMap() {
      resetExperiment();
      show(`<div class="world-dialog-head"><div><span class="expedition-kicker">THE FIELD MAP</span><h2 id="worldDialogTitle">Choose your next discovery</h2></div><button class="world-close" data-close aria-label="Close map">×</button></div><p class="world-dialog-sub">Track a station to explore on foot, travel there, or open its accessible laboratory. Distances are straight lines; follow the paths or go around the river until its bridge is restored. Every station is available from the start.</p><div class="world-station-list">${Expedition.experiments.map((station, index) => {
        const route = World3D.navigationTo(world.cam, station);
        return `<article class="world-station" style="--station:${station.color}"><span class="world-station-icon">${symbol(station.id)}</span><div><span class="world-eyebrow">${escape(station.region)} · ${solved(station.id) ? "RESTORED" : "TO DISCOVER"}</span><h3>${escape(station.name)}</h3><p>${escape(station.summary)}</p><p class="world-map-distance">${Math.round(route.distance)} m ${route.compass} · ${station.id === destination()?.id ? "Tracking" : "Straight-line distance"}</p><div class="world-station-actions"><button data-track="${station.id}" class="world-text-button">Track on foot →</button><button data-travel="${station.id}" class="world-text-button">Travel here ↗</button><button data-lab="${station.id}" class="world-text-button">Open experiment →</button></div></div><span class="world-station-number">0${index + 1}</span></article>`;
      }).join("")}</div>`);
      all("[data-track]").forEach(button => button.addEventListener("click", () => {
        trackStation(Expedition.experiments.find(station => station.id === button.dataset.track)); dialog.close();
      }));
      all("[data-travel]").forEach(button => button.addEventListener("click", () => {
        const station = Expedition.experiments.find(station => station.id === button.dataset.travel);
        dialog.close(); world.travel(station); trackStation(station); persist();
      }));
      all("[data-lab]").forEach(button => button.addEventListener("click", () => openLab(Expedition.experiments.find(station => station.id === button.dataset.lab))));
    }
    function openJournal() {
      resetExperiment();
      const attempts = progress.attempts.slice().reverse();
      show(`<div class="world-dialog-head"><div><span class="expedition-kicker">YOUR FIELD NOTES</span><h2 id="worldDialogTitle">Evidence of discovery</h2></div><button class="world-close" data-close aria-label="Close field notes">×</button></div><p class="world-dialog-sub">Compare your ideas with measured results. The latest 30 records stay on this device and travel with your Atlas backup. A station is restored after an experiment and its explanation check.</p><div class="world-journal">${attempts.length ? attempts.map(attempt => {
        const task = Expedition.mission(attempt.id, attempt.difficulty), result = Expedition.evaluate(attempt.id, attempt.values, attempt.difficulty);
        const comparison = Expedition.comparePrediction(attempt.id, attempt.values, attempt.difficulty, attempt.prediction);
        const settings = task.controls.map(control => `${control.label}: ${attempt.values[control.key]} ${control.unit}`).join(" · ");
        return `<article><span class="world-eyebrow">${escape(attempt.difficulty)} · ${attempt.success ? "EXPERIMENT WORKED" : "TESTED"}</span><h3>${escape(task.name)}</h3><p>${escape(settings)}</p><p class="world-journal-result">${escape(result.feedback)}</p>${comparison ? `<p class="world-prediction-evidence">${escape(comparison.feedback)}</p>` : ""}<dl class="world-metrics">${metricRows(attempt.id, result.metrics, attempt.values)}</dl><button class="world-text-button" data-retest="${attempt.id}" data-tier="${attempt.difficulty}">Test another idea →</button></article>`;
      }).join("") : '<div class="world-empty"><h3>Your first discovery is waiting.</h3><p>Predict what might happen, then try a field experiment. Your settings and results will appear here.</p></div>'}</div><button class="world-action" id="worldJournalMap">Find an experiment →</button>`);
      $("#worldJournalMap").addEventListener("click", openMap);
      all("[data-retest]").forEach(button => button.addEventListener("click", () => {
        progress.settings.difficulty = button.dataset.tier; $("#worldDifficulty").value = tier(); refreshObjective();
        openLab(Expedition.experiments.find(station => station.id === button.dataset.retest));
      }));
    }
    function preview(values, result) {
      world.setExperiment({ id: experiment.id, values, result, model: experiment.model, difficulty: tier() });
    }
    function readValues() { return Object.fromEntries(all("[data-value]").map(input => [input.dataset.value, Number(input.value)])); }
    function openLab(station) {
      experiment = Expedition.mission(station.id, tier()); pending = null; hintStep = 0;
      if (!progress.visited.includes(station.id)) progress.visited.push(station.id);
      persist();
      const controls = experiment.controls.map(control => `<label class="world-lab-control" for="field-${control.key}"><span>${escape(control.label)}<output id="output-${control.key}">${control.value} ${escape(control.unit)}</output></span><input id="field-${control.key}" data-value="${control.key}" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${control.value}"><small>${control.min} – ${control.max} ${escape(control.unit)}</small></label>`).join("");
      const prediction = Expedition.predictionFor(station.id, tier());
      const predictionControl = `<div class="world-prediction"><span class="world-eyebrow">PREDICT BEFORE YOU TEST · OPTIONAL</span><p id="worldPredictionQuestion">${escape(prediction.question)}</p><label for="worldPrediction">Your prediction (${escape(prediction.unit)})</label><input id="worldPrediction" type="number" step="any" min="-1000000" max="1000000" inputmode="decimal" aria-describedby="worldPredictionQuestion worldPredictionHelp worldPredictionError" placeholder="What do you expect?"><small id="worldPredictionHelp">An estimate is welcome. Compare it with the measured result, then refine your idea.</small><p id="worldPredictionError" role="status"></p></div>`;
      show(`<div class="world-dialog-head"><div><span class="expedition-kicker">${escape(station.region)} / ${escape(tier())}</span><h2 id="worldDialogTitle">${escape(station.name)}</h2></div><button class="world-close" data-close aria-label="Leave experiment">×</button></div><p class="world-dialog-sub">${escape(experiment.target)}</p><div class="world-lab-formula">${escape(experiment.formula)}</div><p class="world-model-note">${escape(experiment.explanation)}</p><div class="world-lab-controls">${controls}</div>${predictionControl}<div class="world-lab-actions"><button class="world-action" id="worldRun">Test my idea <span>→</span></button><button class="world-text-button" id="worldHint">A little guidance</button></div><p id="worldHintText" class="world-hint" hidden></p><div id="worldResult" class="world-result" role="status" aria-live="polite"></div><div id="worldReflection"></div><div class="world-lab-links"><button class="world-text-button" id="worldLabMap">← Field map</button><a href="#study">Formula vault ↗</a></div>`, "lab");
      world.focus(station);
      preview(readValues(), null);
      all("[data-value]").forEach(input => input.addEventListener("input", () => {
        const control = experiment.controls.find(control => control.key === input.dataset.value);
        $("#output-" + control.key).textContent = `${input.value} ${control.unit}`;
        pending = null; $("#worldReflection").innerHTML = ""; $("#worldResult").innerHTML = "";
        preview(readValues(), null);
      }));
      $("#worldPrediction").addEventListener("input", () => {
        pending = null; $("#worldReflection").innerHTML = ""; $("#worldResult").innerHTML = "";
        $("#worldPredictionError").textContent = ""; $("#worldPrediction").removeAttribute("aria-invalid");
        preview(readValues(), null);
      });
      $("#worldHint").addEventListener("click", () => { $("#worldHintText").hidden = false; $("#worldHintText").textContent = experiment.hints[Math.min(hintStep++, experiment.hints.length - 1)]; });
      $("#worldLabMap").addEventListener("click", openMap);
      $("#worldRun").addEventListener("click", runExperiment);
    }
    function runExperiment() {
      const predictionInput = $("#worldPrediction");
      if (!predictionInput.validity.valid) {
        $("#worldPredictionError").textContent = "Use a number between −1,000,000 and 1,000,000, or leave your prediction blank.";
        predictionInput.setAttribute("aria-invalid", "true"); predictionInput.focus(); return;
      }
      const prediction = predictionInput.value === "" ? null : predictionInput.valueAsNumber;
      const values = readValues(), result = Expedition.evaluate(experiment.id, values, tier());
      const comparison = Expedition.comparePrediction(experiment.id, values, tier(), prediction);
      const at = Date.now();
      const trial = Expedition.recordTrial(progress, experiment.id, values, tier(), at, prediction);
      progress = trial.progress; persist();
      pending = result.success ? { id: experiment.id, values, difficulty: tier(), at } : null;
      preview(values, result);
      const resultNode = $("#worldResult");
      resultNode.className = `world-result ${result.success ? "is-success" : "is-learning"}`;
      resultNode.innerHTML = `<b>${result.success ? "Your experiment worked." : "An interesting result."}</b><p>${escape(result.feedback)}</p>${comparison ? `<p class="world-prediction-evidence">${escape(comparison.feedback)}</p>` : ""}<dl class="world-metrics">${metricRows(experiment.id, result.metrics || {}, values)}</dl>`;
      cfg.onSound?.(result.success ? "test" : "try");
      if (!result.success) {
        $("#worldReflection").innerHTML = "";
        return;
      }
      const reflection = experiment.reflection;
      $("#worldReflection").innerHTML = `<div class="world-reflection"><span class="world-eyebrow">MAKE THE DISCOVERY YOURS</span><h3>${escape(reflection.question)}</h3><div>${reflection.options.map((option, index) => `<button class="world-reflection-option" data-reflection="${index}">${escape(option)}</button>`).join("")}</div><p id="worldReflectionFeedback" role="status"></p></div>`;
      all("[data-reflection]").forEach(button => button.addEventListener("click", () => {
        if (!pending) return;
        const answer = reflection.options[Number(button.dataset.reflection)];
        if (answer !== reflection.answer) {
          $("#worldReflectionFeedback").textContent = reflection.explain + " Try again with that idea in mind.";
          button.classList.add("is-retry"); cfg.onSound?.("try"); return;
        }
        const recorded = Expedition.completeTrial(progress, pending.id, pending.values, pending.difficulty, pending.at);
        progress = recorded.progress; pending = null;
        world.setCompleted(completedIds());
        cfg.setProgress(progress);
        if (recorded.newCompletion) cfg.onCredit(experiment, recorded.reward);
        if (trackedId === experiment.id) trackedId = null;
        persist(); refreshObjective();
        all("[data-reflection]").forEach(option => { option.disabled = true; }); button.classList.add("is-correct");
        $("#worldReflectionFeedback").textContent = `${reflection.explain} ${recorded.newCompletion ? `Station restored. +${recorded.reward} XP.` : "Discovery revisited. Try another challenge level for a new expedition."}`;
        cfg.onSound?.("complete");
        const done = document.createElement("button"); done.className = "world-action world-return"; done.textContent = "Return to the plateau →";
        done.addEventListener("click", () => dialog.close()); $("#worldReflection").appendChild(done);
      }));
    }
    function openSettings() {
      resetExperiment();
      show(`<div class="world-dialog-head"><div><span class="expedition-kicker">TAKE A BREATH</span><h2 id="worldDialogTitle">Your expedition, your pace</h2></div><button class="world-close" data-close aria-label="Resume expedition">×</button></div><div class="world-setting-row"><label for="worldAudio">Generated sound effects</label><input id="worldAudio" type="checkbox" ${progress.settings.audio ? "checked" : ""}></div><div class="world-setting-row"><label for="worldMotion">Reduce ambient motion</label><input id="worldMotion" type="checkbox" ${progress.settings.reducedMotion ? "checked" : ""}></div><div class="world-setting-row"><label for="worldQuality">Visual quality</label><select id="worldQuality"><option value="auto">Balanced</option><option value="low">Low / battery saver</option><option value="high">High</option></select></div><h3 class="world-settings-heading">Make the controls comfortable</h3><p class="world-dialog-sub">Select a binding, then press a key. Duplicate keys are rejected. Map and field notes provide access without walking. Gamepad: left stick moves, right stick turns, A jumps, X interacts.</p><div class="world-bindings">${Object.entries(progress.settings.bindings).map(([action, key]) => `<button data-binding="${action}"><span>${escape(action.replace(/([A-Z])/g, " $1"))}</span><kbd>${keyLabel(key)}</kbd></button>`).join("")}</div><p id="worldBindingStatus" role="status"></p><button class="world-action" id="worldApplySettings">Save & resume →</button><div class="world-lab-links"><a href="#settings">Atlas settings & backups ↗</a><button class="world-text-button" id="worldPauseMap">Field map →</button></div>`);
      $("#worldQuality").value = progress.settings.quality;
      all("[data-binding]").forEach(button => button.addEventListener("click", () => {
        $("#worldBindingStatus").textContent = `Press a key for ${button.dataset.binding}.`;
        button.onkeydown = event => {
          if (event.key === "Tab") { button.onkeydown = null; $("#worldBindingStatus").textContent = "Key change cancelled."; return; }
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); button.onkeydown = null; $("#worldBindingStatus").textContent = "Key change cancelled."; return; }
          event.preventDefault(); event.stopPropagation();
          const key = event.key.toLowerCase();
          if (key === "m" || !/^(?:[a-z0-9]| |arrow(?:left|right|up|down)|shift)$/.test(key)) { $("#worldBindingStatus").textContent = "That key is reserved. Choose a letter, arrow, Shift, or Space."; return; }
          const duplicate = Object.entries(progress.settings.bindings).some(([action, value]) => action !== button.dataset.binding && value === key);
          if (duplicate) { $("#worldBindingStatus").textContent = "That key already has a job. Choose another key."; return; }
          progress.settings.bindings[button.dataset.binding] = key;
          button.querySelector("kbd").textContent = keyLabel(key); button.onkeydown = null;
          $("#worldBindingStatus").textContent = "Control updated.";
        };
      }));
      $("#worldApplySettings").addEventListener("click", () => {
        progress.settings.audio = $("#worldAudio").checked; progress.settings.reducedMotion = $("#worldMotion").checked; progress.settings.quality = $("#worldQuality").value;
        persist(); dialog.close(); const position = world.snapshot(); world.stop(); createWorld(position); cfg.onToast("Expedition settings saved.");
      });
      $("#worldPauseMap").addEventListener("click", openMap);
    }
    function createWorld(spawn) {
      world = World3D.mountWorld($("#worldHost"), {
        stations: Expedition.experiments, spawn: spawn || progress.position, completed: completedIds(), beacon: next(),
        reduced: cfg.reduced || progress.settings.reducedMotion || matchMedia("(prefers-reduced-motion: reduce)").matches,
        quality: progress.settings.quality, forceCanvas: new URLSearchParams(location.search).get("renderer") === "canvas", bindings: progress.settings.bindings,
        onEnter: openLab, onPause: openSettings,
        onNear(station) { $("#worldNear").hidden = !station; if (station) $("#worldNearName").textContent = station.name; },
        onUpdate(state) {
          drawMap(state.cam);
          updateNavigation(state.cam);
          $("#worldCoordinates").textContent = `${Math.abs(Math.round(state.cam.x))} ${state.cam.x < 0 ? "W" : "E"} · ${Math.abs(Math.round(state.cam.z))} ${state.cam.z < 0 ? "N" : "S"}`;
          const nearby = Expedition.experiments.slice().sort((a, b) => Math.hypot(a.x - state.cam.x, a.z - state.cam.z) - Math.hypot(b.x - state.cam.x, b.z - state.cam.z))[0];
          $("#worldRegion").textContent = Math.hypot(nearby.x - state.cam.x, nearby.z - state.cam.z) < 25 ? nearby.region : "Observatory meadow";
          $("#worldRenderInfo").textContent = state.renderer;
          if (state.elapsed - lastSave > 8) { lastSave = state.elapsed; persist(); }
        }
      });
      const bind = progress.settings.bindings;
      $("#worldControlHint").textContent = `${keyLabel(bind.forward)}${keyLabel(bind.left)}${keyLabel(bind.back)}${keyLabel(bind.right)} walk · drag / ${keyLabel(bind.turnL)}${keyLabel(bind.turnR)} look · ${keyLabel(bind.jump)} jump · ${keyLabel(bind.sprint)} run`;
      $("#worldInteract kbd").textContent = keyLabel(bind.interact);
      lastSave = 0; world.start(); refreshObjective(); drawMap(world.cam);
    }
    function shortcut(event) {
      if (event.key.toLowerCase() === "m" && !dialog.open && !event.target.closest?.("input,textarea,select")) { event.preventDefault(); openMap(); }
    }
    function beforeLeave() { if (!disposed) persist(); }
    global.addEventListener("keydown", shortcut); global.addEventListener("pagehide", beforeLeave);
    $("#worldMapButton").addEventListener("click", openMap); $("#worldTrack").addEventListener("click", openMap);
    $("#worldJournalButton").addEventListener("click", openJournal); $("#worldSettingsButton").addEventListener("click", openSettings);
    $("#worldInteract").addEventListener("click", () => { if (world.nearest()) openLab(world.nearest()); });
    $("#worldDifficulty").addEventListener("change", event => { progress.settings.difficulty = event.target.value; persist(); refreshObjective(); });
    all("[data-action]").forEach(button => {
      button.addEventListener("pointerdown", event => { event.preventDefault(); button.setPointerCapture(event.pointerId); world.setKey(button.dataset.action, true); });
      for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) button.addEventListener(name, () => world.setKey(button.dataset.action, false));
    });
    createWorld();
    if (!hasStarted) welcome();
    return { stop() { persist(); disposed = true; if (dialog.open) dialog.close(); world.stop(); global.removeEventListener("keydown", shortcut); global.removeEventListener("pagehide", beforeLeave); }, stats: () => world.stats() };
  }
  global.WorldUI = { mount };
})(typeof window !== "undefined" ? window : globalThis);
