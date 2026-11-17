(function (global) {
  "use strict";

  const DIFFICULTIES = ["beginner", "standard", "advanced"];
  const GRAVITY = 9.81;
  const BINDINGS = Object.freeze({ forward: "w", back: "s", left: "a", right: "d", turnL: "arrowleft", turnR: "arrowright", jump: " ", interact: "e", sprint: "shift" });
  const experiments = [
    { id: "bridge", name: "The missing span", region: "Geometry Crossing", x: -30, z: 10, color: "#76d9cb", gen: "geometry", summary: "Fit a diagonal brace and bring a river crossing back to life." },
    { id: "projectile", name: "A message through the sky", region: "Trajectory Ridge", x: 35, z: -28, color: "#ffc77c", gen: "trig", summary: "Deliver a light capsule by choosing its launch speed and angle." },
    { id: "balance", name: "The balanced gate", region: "Force Quarry", x: -45, z: -45, color: "#e7a7ad", gen: "linear", summary: "Balance a lever to release the quarry's heavy gate." },
    { id: "energy", name: "Power the hillside", region: "Energy Highlands", x: 60, z: 35, color: "#c1d997", gen: "funceval", summary: "Turn height into motion and restart the hill's turbine." },
    { id: "waves", name: "A signal across the lake", region: "Resonance Lake", x: 10, z: -70, color: "#aac9ff", gen: "funceval", summary: "Tune a wave to carry a signal to the far shore." },
    { id: "garden", name: "A garden for everyone", region: "Ratio Gardens", x: -65, z: 55, color: "#d7b6ef", gen: "geometry", summary: "Plan a rectangular growing bed with the right area and fencing." }
  ].map(Object.freeze);
  const IDS = new Set(experiments.map((e) => e.id));
  const tidy = (n) => Number(n.toFixed(2));
  const difficultyIndex = (difficulty) => {
    const index = DIFFICULTIES.indexOf(difficulty);
    if (index < 0) throw new RangeError("Choose beginner, standard, or advanced difficulty.");
    return index;
  };
  const control = (key, label, min, max, step, value, unit) => ({ key, label, min, max, step, value, unit });

  function mission(id, difficulty = "standard") {
    const experiment = experiments.find((e) => e.id === id);
    if (!experiment) throw new RangeError("Unknown expedition experiment.");
    const i = difficultyIndex(difficulty);
    let details;
    if (id === "bridge") {
      const span = [3, 6, 9][i], rise = [4, 8, 12][i];
      details = {
        controls: [control("length", "Diagonal brace", 1, 22, 0.1, [4, 7, 11][i], "m")],
        model: { span, rise, required: Math.hypot(span, rise) },
        target: `Join a ${span} m horizontal span to a ${rise} m vertical support. Fit the diagonal within 0.15 m.`,
        formula: "c² = a² + b²",
        hints: ["The brace is the longest side of a right triangle.", `Square ${span} and ${rise}, add the squares, then take the square root.`],
        explanation: "Pythagoras connects the three sides of a right triangle. Adding the two short sides gives the path around the corner, not the diagonal.",
        reflection: { question: "If both short sides double, what happens to the diagonal?", options: ["It stays the same", "It doubles", "It becomes four times longer"], answer: "It doubles", explain: "Doubling both sides multiplies their squares by four. Taking the square root doubles the diagonal." }
      };
    } else if (id === "projectile") {
      const target = [12, 24, 40][i];
      details = {
        controls: [control("speed", "Launch speed", 5, 25, 0.1, 10, "m/s"), control("angle", "Launch angle", 15, 75, 1, 25, "°")],
        model: { target, gravity: GRAVITY, tolerance: [0.8, 0.7, 0.5][i] },
        target: `Land within ${[0.8, 0.7, 0.5][i]} m of the receiver ${target} m away. Launch and landing heights are equal.`,
        formula: "x = v cos(θ)t · y = v sin(θ)t − ½gt²",
        hints: ["Speed controls how far the capsule can go. The angle divides that speed into horizontal and vertical motion.", "For a fixed speed and equal launch/landing heights, 45° gives the longest range. Try it, then adjust the speed."],
        explanation: "This model uses Earth gravity, g = 9.81 m/s², without air resistance. Gravity changes vertical velocity; horizontal velocity stays constant. Range is v² sin(2θ)/g.",
        reflection: { question: "Without air resistance, what changes during flight?", options: ["Horizontal speed increases", "Gravity stops at the top", "Vertical velocity changes"], answer: "Vertical velocity changes", explain: "Gravity accelerates the capsule downward throughout its flight. Its horizontal velocity remains constant." }
      };
    } else if (id === "balance") {
      const leftForce = [8, 12, 18][i], leftDistance = [2, 3, 4][i];
      details = {
        controls: [control("force", "Counterweight force", 1, 40, 0.5, 6, "N"), control("distance", "Distance from pivot", 1, 6, 0.5, 1, "m")],
        model: { leftForce, leftDistance, leftTorque: leftForce * leftDistance },
        target: `Balance ${leftForce} N acting ${leftDistance} m from the pivot. Net torque must be within 0.3 N·m of zero.`,
        formula: "τ = F × d · clockwise torque = anticlockwise torque",
        hints: ["Force and perpendicular distance both affect turning strength.", `The left torque is ${leftForce} × ${leftDistance} = ${leftForce * leftDistance} N·m. Make force × distance match it.`],
        explanation: "These downward forces act perpendicular to a horizontal lever. Equilibrium requires zero net torque about the pivot, so a smaller force can balance a larger one when it acts farther away.",
        reflection: { question: "How can half the force produce the same torque?", options: ["Use twice the distance from the pivot", "Use half the distance from the pivot", "Move it onto the pivot"], answer: "Use twice the distance from the pivot", explain: "Torque is force times perpendicular distance. Halving the force and doubling the distance leaves the product unchanged." }
      };
    } else if (id === "energy") {
      const mass = [2, 3, 5][i], retention = [1, 0.8, 0.6][i], target = [7, 10, 11][i];
      details = {
        controls: [control("height", "Release height", 1, 12, 0.1, 2, "m")],
        model: { mass, retention, target, gravity: GRAVITY },
        target: `Reach ${target} m/s (within 0.15 m/s) at the bottom. The ${mass} kg capsule retains ${retention * 100}% of its starting energy as kinetic energy.`,
        formula: "Eₚ = mgh · Eₖ = ½mv² · v = √(2gh × retained fraction)",
        hints: ["Greater release height provides more gravitational potential energy.", `Only ${retention * 100}% becomes kinetic energy. Rearrange to h = v² / (2g × ${retention}).`],
        explanation: `The capsule starts at rest. ${retention === 1 ? "This ideal ramp has no energy losses." : `${(1 - retention) * 100}% of its starting energy becomes heat or sound.`} Mass cancels when calculating final speed; the remaining energy obeys ½mv² = ${retention}mgh.`,
        reflection: { question: "On this ramp, doubling the capsule's mass changes its final speed how?", options: ["It doubles the speed", "The speed stays the same", "It halves the speed"], answer: "The speed stays the same", explain: "Mass appears in both gravitational potential energy and kinetic energy, so it cancels. Height and retained energy fraction determine the speed." }
      };
    } else if (id === "waves") {
      const target = [6, 12, 20][i];
      details = {
        controls: [control("frequency", "Frequency", 0.5, 8, 0.1, 1, "Hz"), control("wavelength", "Wavelength", 0.5, 12, 0.1, 2, "m")],
        model: { target },
        target: `Configure a wave medium carrying a signal at ${target} m/s, within 0.15 m/s. Adjust frequency and wavelength together.`,
        formula: "v = f × λ",
        hints: ["Frequency counts cycles each second. Wavelength measures metres per cycle.", `Your settings must multiply to ${target}. If frequency doubles in the same medium, wavelength must halve.`],
        explanation: "This configurable teaching medium lets you explore v = fλ. In a fixed real medium the wave speed is set by that medium, so frequency and wavelength cannot be changed independently while keeping the same medium.",
        reflection: { question: "In a fixed medium, what happens to wavelength when frequency doubles?", options: ["It doubles", "It stays the same", "It halves"], answer: "It halves", explain: "The medium's wave speed stays fixed. To keep v = fλ unchanged, doubling frequency requires halving wavelength." }
      };
    } else {
      const target = [12, 24, 48][i], budget = [48, 48, 28][i];
      details = {
        controls: [control("length", "Bed length", 1, 12, 1, 3, "m"), control("width", "Bed width", 1, 12, 1, 2, "m")],
        model: { target, budget },
        target: `Create exactly ${target} m² of growing space${i === 2 ? " using no more than 28 m of fencing" : ""}. Dimensions are whole metres.`,
        formula: "Area = length × width · perimeter = 2(length + width)",
        hints: [`Find two whole numbers whose product is ${target}.`, i === 2 ? "Compare 4 × 12 with 6 × 8: equal area does not mean equal fencing." : "Each 1 m × 1 m planting square contributes one square metre."],
        explanation: "Area measures the growing surface in square metres. Perimeter measures the boundary in metres. Rectangles with the same area can need different amounts of fencing.",
        reflection: { question: "Can two rectangles have equal area but different perimeters?", options: ["Yes, their side lengths can differ", "No, area fixes the perimeter", "Only if one is a circle"], answer: "Yes, their side lengths can differ", explain: "For example, 4 × 12 and 6 × 8 both have area 48 m², but their perimeters are 32 m and 28 m." }
      };
    }
    return { ...experiment, difficulty, ...details };
  }

  function projectile(speed, angle, time, gravity = GRAVITY) {
    if (![speed, angle, time, gravity].every(Number.isFinite) || speed < 0 || time < 0 || gravity <= 0 || angle < 0 || angle > 90) throw new RangeError("Projectile inputs must be finite and physically valid.");
    const radians = angle * Math.PI / 180, vx = speed * Math.cos(radians), initialVy = speed * Math.sin(radians);
    const flight = 2 * initialVy / gravity;
    return { x: vx * time, y: initialVy * time - 0.5 * gravity * time * time, vx, vy: initialVy - gravity * time, range: vx * flight, flight, peak: initialVy * initialVy / (2 * gravity) };
  }

  function evaluate(id, values, difficulty = "standard") {
    let task;
    try { task = mission(id, difficulty); } catch (error) { return { valid: false, success: false, feedback: error.message, metrics: {} }; }
    if (!values || typeof values !== "object" || Array.isArray(values)) return { valid: false, success: false, feedback: "Choose a value for every control.", metrics: {} };
    for (const c of task.controls) {
      const value = values[c.key];
      if (!Number.isFinite(value) || value < c.min || value > c.max || Math.abs((value - c.min) / c.step - Math.round((value - c.min) / c.step)) > 1e-7) {
        return { valid: false, success: false, feedback: `${c.label} must be between ${c.min} and ${c.max} ${c.unit}, in steps of ${c.step}.`, metrics: {} };
      }
    }
    values = Object.fromEntries(task.controls.map((c) => [c.key, values[c.key]]));
    let metrics, success, feedback;
    const model = task.model;
    if (id === "bridge") {
      metrics = { ...model, length: values.length };
      success = Math.abs(values.length - model.required) <= 0.15;
      feedback = success ? `The ${tidy(values.length)} m brace fits. The crossing is restored.` : `The brace is ${values.length < model.required ? "too short" : "too long"}. Its required length is √(${model.span}² + ${model.rise}²) = ${tidy(model.required)} m.`;
    } else if (id === "projectile") {
      metrics = { ...projectile(values.speed, values.angle, 0), ...model, speed: values.speed, angle: values.angle };
      success = Math.abs(metrics.range - model.target) <= model.tolerance;
      feedback = success ? `Delivered! The capsule lands ${tidy(metrics.range)} m away.` : `The capsule lands ${tidy(metrics.range)} m away, ${tidy(Math.abs(metrics.range - model.target))} m ${metrics.range < model.target ? "short of" : "beyond"} the receiver. Adjust speed or angle and try again.`;
    } else if (id === "balance") {
      const rightTorque = values.force * values.distance, netTorque = rightTorque - model.leftTorque;
      metrics = { ...model, ...values, rightTorque, netTorque };
      success = Math.abs(netTorque) <= 0.3;
      feedback = success ? `Balanced at ${tidy(rightTorque)} N·m on each side. The gate can open.` : `Left torque: ${model.leftTorque} N·m. Right torque: ${tidy(rightTorque)} N·m. ${rightTorque < model.leftTorque ? "Increase" : "Decrease"} your force or distance.`;
    } else if (id === "energy") {
      const potential = model.mass * GRAVITY * values.height, kinetic = potential * model.retention, speed = Math.sqrt(2 * kinetic / model.mass);
      metrics = { ...model, height: values.height, potential, kinetic, speed };
      success = Math.abs(speed - model.target) <= 0.15;
      feedback = success ? `The capsule arrives at ${tidy(speed)} m/s. The turbine has enough energy.` : `Final speed: ${tidy(speed)} m/s. ${speed < model.target ? "Raise" : "Lower"} the release height to approach ${model.target} m/s. Potential energy: ${tidy(potential)} J; kinetic energy: ${tidy(kinetic)} J.`;
    } else if (id === "waves") {
      const speed = values.frequency * values.wavelength;
      metrics = { ...model, ...values, speed };
      success = Math.abs(speed - model.target) <= 0.15;
      feedback = success ? `Signal connected at ${tidy(speed)} m/s. The far-shore beacon is online.` : `${values.frequency} Hz × ${values.wavelength} m = ${tidy(speed)} m/s. ${speed < model.target ? "Increase" : "Decrease"} the product to approach ${model.target} m/s.`;
    } else {
      const area = values.length * values.width, perimeter = 2 * (values.length + values.width);
      metrics = { ...model, ...values, area, perimeter };
      success = area === model.target && perimeter <= model.budget;
      feedback = success ? `Planted ${area} m² using ${perimeter} m of fencing. The garden is growing.` : area !== model.target ? `This bed has ${area} m². Adjust length × width to make ${model.target} m².` : `The area is correct, but ${perimeter} m of fencing exceeds the ${model.budget} m budget. Try a rectangle with sides closer in length.`;
    }
    return { valid: true, success, feedback, metrics };
  }

  function sampleSolution(id, difficulty = "standard") {
    const task = mission(id, difficulty), model = task.model;
    if (id === "bridge") return { length: model.required };
    if (id === "projectile") return { speed: Math.round(Math.sqrt(model.target * GRAVITY) * 10) / 10, angle: 45 };
    if (id === "balance") return { force: model.leftForce, distance: model.leftDistance };
    if (id === "energy") return { height: Math.round(model.target * model.target / (2 * GRAVITY * model.retention) * 10) / 10 };
    if (id === "waves") return [{ frequency: 2, wavelength: 3 }, { frequency: 3, wavelength: 4 }, { frequency: 4, wavelength: 5 }][difficultyIndex(difficulty)];
    return [{ length: 4, width: 3 }, { length: 6, width: 4 }, { length: 8, width: 6 }][difficultyIndex(difficulty)];
  }

  function predictionFor(id, difficulty = "standard") {
    const task = mission(id, difficulty);
    const predictions = {
      bridge: { label: "Required brace length", unit: "m", metric: "required", question: `What diagonal length will join the ${task.model.span} m span and ${task.model.rise} m support?` },
      projectile: { label: "Landing distance", unit: "m", metric: "range", question: "How far horizontally will the capsule travel with your chosen launch speed and angle?" },
      balance: { label: "Right-hand torque", unit: "N\u00b7m", metric: "rightTorque", question: "What torque will your chosen counterweight force and distance produce about the pivot?" },
      energy: { label: "Speed at the bottom", unit: "m/s", metric: "speed", question: "What speed will the capsule reach at the bottom with your chosen release height and this ramp's retained energy fraction?" },
      waves: { label: "Wave speed", unit: "m/s", metric: "speed", question: "What wave speed will your chosen frequency and wavelength produce?" },
      garden: { label: "Growing area", unit: "m\u00b2", metric: "area", question: "What growing area will your chosen bed length and width enclose?" }
    };
    return predictions[id];
  }

  const validPrediction = (value) => Number.isFinite(value) && Math.abs(value) <= 1000000;

  function comparePrediction(id, values, difficulty = "standard", prediction = null) {
    if (!validPrediction(prediction)) return null;
    const result = evaluate(id, values, difficulty);
    if (!result.valid) return null;
    const { metric, unit } = predictionFor(id, difficulty), observed = result.metrics[metric];
    if (!Number.isFinite(observed)) return null;
    const difference = prediction - observed;
    const format = (value) => Number(value.toPrecision(6));
    const feedback = difference === 0
      ? `Your prediction matches the observed result: ${format(observed)} ${unit}.`
      : `Predicted ${format(prediction)} ${unit}; observed ${format(observed)} ${unit}. Your prediction is ${format(Math.abs(difference))} ${unit} ${difference > 0 ? "above" : "below"} the observed result.`;
    return { predicted: prediction, observed, difference, unit, feedback };
  }

  function createProgress() {
    return { version: 1, position: { x: 0, z: 28, yaw: 0 }, visited: [], completed: {}, attempts: [], settings: { difficulty: "standard", audio: true, reducedMotion: false, quality: "auto", bindings: { ...BINDINGS } } };
  }

  const plain = (value) => value && typeof value === "object" && !Array.isArray(value);
  const bounded = (value, fallback, min, max) => Number.isFinite(value) && value >= min && value <= max ? value : fallback;
  function sanitizeProgress(raw) {
    const progress = createProgress();
    if (!plain(raw) || raw.version !== 1) return progress;
    if (plain(raw.position)) {
      progress.position.x = bounded(raw.position.x, 0, -108, 108);
      progress.position.z = bounded(raw.position.z, 28, -108, 108);
      progress.position.yaw = bounded(raw.position.yaw, 0, -Math.PI * 2, Math.PI * 2);
    }
    if (Array.isArray(raw.visited)) progress.visited = [...new Set(raw.visited.filter((id) => IDS.has(id)))];
    if (plain(raw.completed)) {
      for (const experiment of experiments) for (const difficulty of DIFFICULTIES) {
        const key = `${experiment.id}:${difficulty}`, item = raw.completed[key];
        if (!plain(item) || !evaluate(experiment.id, item.values, difficulty).success) continue;
        progress.completed[key] = { at: bounded(item.at, 0, 0, Number.MAX_SAFE_INTEGER), values: Object.fromEntries(mission(experiment.id, difficulty).controls.map((c) => [c.key, item.values[c.key]])) };
      }
    }
    if (Array.isArray(raw.attempts)) {
      for (const attempt of raw.attempts.slice(-30)) {
        if (!plain(attempt) || !IDS.has(attempt.id) || !DIFFICULTIES.includes(attempt.difficulty)) continue;
        const result = evaluate(attempt.id, attempt.values, attempt.difficulty);
        if (!result.valid) continue;
        progress.attempts.push({ id: attempt.id, difficulty: attempt.difficulty, at: bounded(attempt.at, 0, 0, Number.MAX_SAFE_INTEGER), success: result.success, values: Object.fromEntries(mission(attempt.id, attempt.difficulty).controls.map((c) => [c.key, attempt.values[c.key]])), ...(validPrediction(attempt.prediction) ? { prediction: attempt.prediction } : {}) });
      }
    }
    if (plain(raw.settings)) {
      if (DIFFICULTIES.includes(raw.settings.difficulty)) progress.settings.difficulty = raw.settings.difficulty;
      if (typeof raw.settings.audio === "boolean") progress.settings.audio = raw.settings.audio;
      if (typeof raw.settings.reducedMotion === "boolean") progress.settings.reducedMotion = raw.settings.reducedMotion;
      if (["auto", "low", "high"].includes(raw.settings.quality)) progress.settings.quality = raw.settings.quality;
      if (plain(raw.settings.bindings)) {
        const used = new Set();
        const candidate = {};
        let valid = true;
        for (const action of Object.keys(BINDINGS)) {
          const key = raw.settings.bindings[action];
          if (typeof key !== "string" || !/^(?:[a-z0-9]| |arrow(?:left|right|up|down)|shift)$/.test(key) || used.has(key)) { valid = false; break; }
          used.add(key); candidate[action] = key;
        }
        if (valid) progress.settings.bindings = candidate;
      }
    }
    return progress;
  }

  function recordTrial(raw, id, values, difficulty = "standard", now = Date.now(), prediction = null) {
    const progress = sanitizeProgress(raw), result = evaluate(id, values, difficulty);
    if (!result.valid) return { progress, result, newCompletion: false, reward: 0 };
    const storedValues = Object.fromEntries(mission(id, difficulty).controls.map((c) => [c.key, values[c.key]]));
    const at = bounded(now, Date.now(), 0, Number.MAX_SAFE_INTEGER);
    progress.attempts.push({ id, difficulty, at, success: result.success, values: storedValues, ...(validPrediction(prediction) ? { prediction } : {}) });
    progress.attempts = progress.attempts.slice(-30);
    if (!progress.visited.includes(id)) progress.visited.push(id);
    return { progress, result, newCompletion: false, reward: 0 };
  }

  function completeTrial(raw, id, values, difficulty = "standard", now = Date.now()) {
    const progress = sanitizeProgress(raw), result = evaluate(id, values, difficulty);
    if (!result.valid) return { progress, result, newCompletion: false, reward: 0 };
    const storedValues = Object.fromEntries(mission(id, difficulty).controls.map((c) => [c.key, values[c.key]]));
    const at = bounded(now, Date.now(), 0, Number.MAX_SAFE_INTEGER);
    const key = `${id}:${difficulty}`, newCompletion = result.success && !progress.completed[key];
    if (newCompletion) progress.completed[key] = { at, values: storedValues };
    return { progress, result, newCompletion, reward: newCompletion ? [50, 80, 120][difficultyIndex(difficulty)] : 0 };
  }

  function recordAttempt(raw, id, values, difficulty = "standard", now = Date.now(), prediction = null) {
    const trial = recordTrial(raw, id, values, difficulty, now, prediction);
    return completeTrial(trial.progress, id, values, difficulty, now);
  }

  global.Expedition = Object.freeze({ experiments, difficulties: DIFFICULTIES, gravity: GRAVITY, bindings: BINDINGS, mission, evaluate, projectile, sampleSolution, predictionFor, comparePrediction, createProgress, sanitizeProgress, recordTrial, completeTrial, recordAttempt });
})(typeof window === "undefined" ? globalThis : window);
