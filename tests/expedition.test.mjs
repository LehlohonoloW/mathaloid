import assert from "node:assert/strict";
import test from "node:test";
await import("../js/expedition.js");
const E = globalThis.Expedition;

test("successful trials preserve evidence immediately while explanation alone grants completion", () => {
  const trial = E.recordTrial(E.createProgress(), "bridge", { length: 10 }, "standard", 100, 11);
  assert.equal(trial.result.success, true); assert.equal(trial.reward, 0);
  assert.equal(Object.keys(trial.progress.completed).length, 0);
  assert.equal(trial.progress.attempts[0].prediction, 11);
  const reopened = E.sanitizeProgress(JSON.parse(JSON.stringify(trial.progress)));
  assert.equal(reopened.attempts[0].success, true); assert.equal(reopened.attempts[0].prediction, 11);
  const completed = E.completeTrial(reopened, "bridge", { length: 10 }, "standard", 100);
  assert.equal(completed.reward, 80); assert.equal(completed.progress.attempts.length, 1);
  assert.equal(E.completeTrial(completed.progress, "bridge", { length: 10 }).reward, 0);
  assert.equal(E.completeTrial(reopened, "bridge", { length: 3 }).reward, 0);
});

test("all 18 missions are attainable through their declared controls", () => {
  for (const experiment of E.experiments) for (const difficulty of E.difficulties) {
    const task = E.mission(experiment.id, difficulty);
    const result = E.evaluate(experiment.id, E.sampleSolution(experiment.id, difficulty), difficulty);
    assert.equal(result.valid, true, `${experiment.id}:${difficulty} has valid input`);
    assert.equal(result.success, true, `${experiment.id}:${difficulty} can succeed`);
    assert(task.reflection.options.includes(task.reflection.answer));
    assert(task.hints.length >= 2 && task.formula && task.explanation);
  }
});

test("ballistic model preserves horizontal velocity and returns to landing height", () => {
  const start = E.projectile(15, 40, 0);
  const top = E.projectile(15, 40, start.flight / 2);
  const end = E.projectile(15, 40, start.flight);
  assert(Math.abs(end.y) < 1e-10);
  assert(Math.abs(top.vy) < 1e-10);
  assert(Math.abs(top.y - start.peak) < 1e-10);
  assert.equal(end.vx, start.vx);
  assert(Math.abs(end.x - start.range) < 1e-10);
  const alternateAngle = E.projectile(15, 50, 0);
  assert(Math.abs(alternateAngle.range - start.range) < 1e-10);
  assert(E.projectile(15, 45, 0).range > start.range);
  assert.throws(() => E.projectile(15, 45, 1, 0), RangeError);
});

test("physical results satisfy energy, torque, area and wave relations", () => {
  const energy = E.evaluate("energy", { height: 5 }, "standard").metrics;
  assert.equal(energy.potential, energy.mass * E.gravity * energy.height);
  assert.equal(energy.kinetic, energy.potential * energy.retention);
  assert(Math.abs(energy.kinetic - 0.5 * energy.mass * energy.speed ** 2) < 1e-10);
  const balanceA = E.evaluate("balance", { force: 12, distance: 3 });
  const balanceB = E.evaluate("balance", { force: 6, distance: 6 });
  assert.equal(balanceA.metrics.netTorque, 0);
  assert.equal(balanceB.metrics.netTorque, 0);
  assert.equal(E.evaluate("waves", { frequency: 3, wavelength: 4 }).metrics.speed, 12);
  assert.equal(E.evaluate("waves", { frequency: 6, wavelength: 2 }).metrics.speed, 12);
  assert.equal(E.evaluate("garden", { length: 4, width: 12 }, "advanced").success, false);
  assert.equal(E.evaluate("garden", { length: 6, width: 8 }, "advanced").success, true);
  assert.equal(E.evaluate("bridge", { length: 10 }).metrics.required, 10);
});

test("invalid, non-finite, out-of-range and fractional grid inputs cannot earn progress", () => {
  for (const values of [null, [], {}, { length: NaN }, { length: Infinity }, { length: "10" }, { length: 100 }, { length: 0 }, { length: 10.03 }]) {
    const recorded = E.recordAttempt(E.createProgress(), "bridge", values);
    assert.equal(recorded.result.valid, false);
    assert.equal(recorded.reward, 0);
    assert.equal(Object.keys(recorded.progress.completed).length, 0);
  }
  assert.equal(E.evaluate("garden", { length: 6.5, width: 4 }).valid, false);
  assert.equal(E.evaluate("unknown", {}).valid, false);
  assert.equal(E.evaluate("bridge", { length: 10 }, "unknown").valid, false);
  const injected = E.evaluate("waves", { frequency: 3, wavelength: 4, target: 999, payload: "ignore" });
  assert.equal(injected.metrics.target, 12);
  assert.equal(injected.metrics.payload, undefined);
});

test("save sanitization bounds state, removes corrupt completion and unknown fields", () => {
  const raw = {
    version: 1,
    position: { x: 1e10, z: NaN, yaw: Infinity },
    visited: ["bridge", "bridge", "unknown"],
    completed: { "bridge:standard": { at: 100, values: { length: 10 } }, "waves:standard": { values: { frequency: 1, wavelength: 1 } }, "unknown:standard": { values: {} } },
    attempts: Array.from({ length: 90 }, (_, at) => ({ id: "bridge", difficulty: "standard", at, values: { length: 10 }, success: false })),
    settings: { difficulty: "alien", audio: "yes", reducedMotion: true, bindings: { forward: "w", back: "w" } },
    payload: "discard"
  };
  const safe = E.sanitizeProgress(raw);
  assert.deepEqual(safe.position, E.createProgress().position);
  assert.deepEqual(safe.visited, ["bridge"]);
  assert.deepEqual(Object.keys(safe.completed), ["bridge:standard"]);
  assert.equal(safe.attempts.length, 30);
  assert(safe.attempts.every((a) => a.success));
  assert.equal(safe.settings.reducedMotion, true);
  assert.equal(safe.settings.difficulty, "standard");
  assert.deepEqual(safe.settings.bindings, E.bindings);
  assert.equal(safe.payload, undefined);
  assert.deepEqual(E.sanitizeProgress({ version: 99 }), E.createProgress());
});

test("first reflected success rewards once, replays do not, difficulty completions are separate", () => {
  const source = E.createProgress();
  const first = E.recordAttempt(source, "bridge", { length: 10 }, "standard", 100);
  assert.equal(first.newCompletion, true);
  assert.equal(first.reward, 80);
  assert.equal(Object.keys(source.completed).length, 0, "recording returns a new state");
  const replay = E.recordAttempt(first.progress, "bridge", { length: 10 }, "standard", 101);
  assert.equal(replay.newCompletion, false);
  assert.equal(replay.reward, 0);
  const advanced = E.recordAttempt(replay.progress, "bridge", { length: 15 }, "advanced", 102);
  assert.equal(advanced.reward, 120);
  assert.equal(Object.keys(advanced.progress.completed).length, 2);
  const fail = E.recordAttempt(advanced.progress, "bridge", { length: 7 }, "standard", 103);
  assert.equal(fail.result.success, false);
  assert.equal(fail.progress.attempts.length, 4);
  assert.deepEqual(fail.progress.visited, ["bridge"]);
  assert.deepEqual(E.sanitizeProgress(JSON.parse(JSON.stringify(fail.progress))), fail.progress);
});

test("valid custom bindings survive export and import; duplicates reset safely", () => {
  const progress = E.createProgress();
  progress.settings.bindings.forward = "i";
  progress.settings.bindings.back = "k";
  assert.equal(E.sanitizeProgress(progress).settings.bindings.forward, "i");
  progress.settings.bindings.back = "i";
  assert.deepEqual(E.sanitizeProgress(progress).settings.bindings, E.bindings);
});

test("prediction prompts identify the measured quantity for all 18 missions", () => {
  const quantities = {
    bridge: ["required", "m"], projectile: ["range", "m"], balance: ["rightTorque", "N\u00b7m"],
    energy: ["speed", "m/s"], waves: ["speed", "m/s"], garden: ["area", "m\u00b2"]
  };
  for (const [id, [metric, unit]] of Object.entries(quantities)) for (const difficulty of E.difficulties) {
    const prompt = E.predictionFor(id, difficulty);
    assert.equal(prompt.metric, metric);
    assert.equal(prompt.unit, unit);
    assert(prompt.label.length > 0 && prompt.question.endsWith("?"));
    assert.equal(typeof E.evaluate(id, E.sampleSolution(id, difficulty), difficulty).metrics[metric], "number");
  }
  assert.match(E.predictionFor("bridge", "advanced").question, /9 m span and 12 m support/);
  assert.deepEqual(E.predictionFor("bridge"), E.predictionFor("bridge", "standard"));
  assert.throws(() => E.predictionFor("unknown"), RangeError);
  assert.throws(() => E.predictionFor("bridge", "unknown"), RangeError);
});

test("predictions compare actual physical quantities, independently of mission success", () => {
  const cases = [
    ["bridge", { length: 7 }, "standard", 10, "m"],
    ["projectile", { speed: 12, angle: 30 }, "advanced", 12 ** 2 * Math.sin(Math.PI / 3) / 9.81, "m"],
    ["balance", { force: 6, distance: 2 }, "standard", 12, "N\u00b7m"],
    ["energy", { height: 5 }, "advanced", Math.sqrt(2 * 9.81 * 5 * 0.6), "m/s"],
    ["waves", { frequency: 2, wavelength: 3 }, "standard", 6, "m/s"],
    ["garden", { length: 4, width: 3 }, "standard", 12, "m\u00b2"]
  ];
  for (const [id, values, difficulty, expected, unit] of cases) {
    assert.equal(E.evaluate(id, values, difficulty).success, false, `${id} is deliberately outside its mission target`);
    const comparison = E.comparePrediction(id, values, difficulty, expected + 2);
    assert(Math.abs(comparison.observed - expected) < 1e-10, `${id} compares the physical result`);
    assert.equal(comparison.predicted, expected + 2);
    assert(Math.abs(comparison.difference - 2) < 1e-10, "difference is predicted minus observed");
    assert.equal(comparison.unit, unit);
    assert(comparison.feedback.includes(`2 ${unit} above`));
  }
});

test("comparison feedback reports above, below and matches with magnitude and units", () => {
  const values = { force: 6, distance: 2 };
  const above = E.comparePrediction("balance", values, "standard", 15);
  const below = E.comparePrediction("balance", values, "standard", 10);
  const match = E.comparePrediction("balance", values, "standard", 12);
  assert.equal(above.difference, 3);
  assert(above.feedback.includes("3 N\u00b7m above"));
  assert.equal(below.difference, -2);
  assert(below.feedback.includes("2 N\u00b7m below"));
  assert.equal(match.difference, 0);
  assert.match(match.feedback, /matches/);
  assert(match.feedback.includes("12 N\u00b7m"));
  const smallDifference = E.comparePrediction("bridge", { length: 10 }, "standard", 10.00001);
  assert(smallDifference.feedback.includes("0.00001 m above"), "small differences do not round to zero");
  for (const result of [above, below, match]) assert.doesNotMatch(result.feedback, /master|learned|understand/i);
});

test("absent, nonnumeric, non-finite and unbounded predictions are optional and discarded", () => {
  const invalid = [undefined, null, NaN, Infinity, -Infinity, "10", "", true, false, [], {}, new Number(10), 1000001, -1000001];
  for (const prediction of invalid) {
    assert.equal(E.comparePrediction("bridge", { length: 10 }, "standard", prediction), null);
    const recorded = E.recordAttempt(E.createProgress(), "bridge", { length: 10 }, "standard", 100, prediction);
    assert.equal(recorded.reward, 80, "an invalid optional prediction does not block completion");
    assert.equal(Object.hasOwn(recorded.progress.attempts[0], "prediction"), false);
  }
  assert.equal(E.comparePrediction("bridge", { length: 10 }), null);
  for (const prediction of [0, -10, 1000000, -1000000]) {
    assert.equal(E.comparePrediction("bridge", { length: 10 }, "standard", prediction).predicted, prediction);
    assert.equal(E.recordAttempt(E.createProgress(), "bridge", { length: 10 }, "standard", 100, prediction).progress.attempts[0].prediction, prediction);
  }
  for (const values of [null, {}, { length: "10" }, { length: NaN }, { length: 100 }]) {
    assert.equal(E.comparePrediction("bridge", values, "standard", 10), null);
    const recorded = E.recordAttempt(E.createProgress(), "bridge", values, "standard", 100, 10);
    assert.equal(recorded.progress.attempts.length, 0);
    assert.equal(recorded.reward, 0);
  }
  assert.equal(E.comparePrediction("unknown", {}, "standard", 10), null);
  assert.equal(E.comparePrediction("bridge", { length: 10 }, "unknown", 10), null);
});

test("predictions survive backup round trips without changing any of the 18 mission rewards", () => {
  let baseline = E.createProgress(), predicted = E.createProgress(), at = 100;
  for (const experiment of E.experiments) for (const difficulty of E.difficulties) {
    const values = E.sampleSolution(experiment.id, difficulty);
    const ordinary = E.recordAttempt(baseline, experiment.id, values, difficulty, at);
    const forecast = E.recordAttempt(predicted, experiment.id, values, difficulty, at++, 999);
    assert.equal(forecast.reward, ordinary.reward);
    assert.equal(forecast.newCompletion, ordinary.newCompletion);
    assert.deepEqual(forecast.result, ordinary.result);
    baseline = ordinary.progress;
    predicted = E.sanitizeProgress(JSON.parse(JSON.stringify(forecast.progress)));
    assert.equal(predicted.attempts.at(-1).prediction, 999);
  }
  assert.equal(predicted.version, 1);
  assert.equal(Object.keys(predicted.completed).length, 18);
  const withoutPredictions = { ...predicted, attempts: predicted.attempts.map(({ prediction, ...attempt }) => attempt) };
  assert.deepEqual(withoutPredictions, baseline, "prediction metadata changes no other progress fields");
  const replay = E.recordAttempt(predicted, "bridge", { length: 10 }, "standard", at++, 0);
  assert.equal(replay.reward, 0);
  const failed = E.recordAttempt(replay.progress, "bridge", { length: 7 }, "standard", at, 10);
  assert.equal(failed.reward, 0);
  assert.equal(failed.progress.attempts.at(-1).prediction, 10);
  assert.equal(failed.progress.attempts.at(-1).success, false);
  assert.deepEqual(E.sanitizeProgress(JSON.parse(JSON.stringify(failed.progress))), failed.progress);
});

test("version 1 attempts remain compatible and imported malformed prediction fields are removed", () => {
  const legacy = E.recordAttempt(E.createProgress(), "bridge", { length: 10 }, "standard", 100).progress;
  assert.equal(Object.hasOwn(legacy.attempts[0], "prediction"), false);
  assert.deepEqual(E.sanitizeProgress(JSON.parse(JSON.stringify(legacy))), legacy);
  const raw = {
    ...legacy,
    attempts: [0, -1000000, 1000000, null, NaN, Infinity, "10", false, [], { predicted: 10 }, 1000001, -1000001]
      .map((prediction, at) => ({ ...legacy.attempts[0], at, prediction, observed: -1, difference: -1, feedback: "mastered", extra: "discard" }))
  };
  const safe = E.sanitizeProgress(raw);
  assert.equal(safe.attempts.length, raw.attempts.length, "a bad prediction does not discard a valid old attempt");
  for (const [index, attempt] of safe.attempts.entries()) {
    if (index < 3) assert.equal(attempt.prediction, raw.attempts[index].prediction);
    else assert.equal(Object.hasOwn(attempt, "prediction"), false);
    assert.equal(attempt.observed, undefined);
    assert.equal(attempt.difference, undefined);
    assert.equal(attempt.feedback, undefined);
    assert.equal(attempt.extra, undefined);
  }
  assert.deepEqual(E.sanitizeProgress(JSON.parse(JSON.stringify(safe))), safe);
  const sourceAttempt = raw.attempts[0];
  safe.attempts[0].prediction = 42;
  assert.equal(sourceAttempt.prediction, 0, "sanitization does not mutate the imported attempt");
});
