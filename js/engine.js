/* MATHALOID ATLAS — AtlasSkillEngine. MIT License.
   Local-first: every byte of state lives in localStorage on THIS device. */
"use strict";

const Engine = (() => {
  const KEY = "atlas.state.v1";
  const LEGACY_KEY = "mathbot.state.v1";
  const todayStr = () => new Date().toISOString().slice(0, 10);

  const defaultState = () => ({
    version: 1,
    createdAt: Date.now(),
    xp: 0,
    streak: { count: 1, last: todayStr() },
    passport: { understand: 18, fluent: 12, apply: 8, reason: 6, create: 4 },
    skills: {},            // id -> {mastery, attempts, correct, due, last}
    totals: { attempts: 0, correct: 0, bestRun: 0, focusSessions: 0, bossWins: 0 },
    goal: { date: todayStr(), done: 0, target: 1 },
    settings: { theme: "cosmic", lens: "caps", grade: "8", textSize: "normal", density: "cozy", sound: true, reducedMotion: false, speak: false },
    notes: "",
    bookmarks: [],
    bests: { drill: 0, timed: 0, mixed: 0, boss: 0 },
    leaderboard: [ { name: "Ava", xp: 9520 }, { name: "Liam", xp: 8430 }, { name: "Zoe", xp: 7890 } ],
    badges: [],
    chat: [],
    lessonProgress: {},     // lessonId -> step index
  });

  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
      const legacy = localStorage.getItem(LEGACY_KEY); // migrate v1 Mathaloid players
      const s = defaultState();
      if (legacy) {
        try { const l = JSON.parse(legacy); s.xp = l.xp || l.totalXp || 0; } catch (e) {}
      }
      return s;
    } catch (e) { return defaultState(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  function touchStreak() {
    const t = todayStr();
    if (S.streak.last === t) return;
    const yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    S.streak.count = S.streak.last === yest ? S.streak.count + 1 : 1;
    S.streak.last = t;
    if (S.goal.date !== t) { S.goal.date = t; S.goal.done = 0; }
    save();
  }

  /* ---------- randomness helpers ---------- */
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  function opts(ans, spread, fmt) {
    fmt = fmt || ((x) => String(x));
    const set = new Set([fmt(ans)]);
    let guard = 0;
    while (set.size < 4 && guard++ < 60) {
      const d = ans + pick([-1, 1]) * ri(1, spread);
      if (fmt(d) !== fmt(ans)) set.add(fmt(d));
    }
    return shuffle([...set]);
  }

  /* ---------- question generators ----------
     Each returns {prompt, answer(str), options[4], hints[], explain, dims} */
  const GENS = {
    counting(lv) {
      const n = ri(2, 8 + lv * 2);
      const step = pick([1, 2, 5, 10]);
      const seq = [n, n + step, n + 2 * step];
      const ans = n + 3 * step;
      return { prompt: `${seq.join(", ")}, … — what comes next?`, answer: String(ans), options: opts(ans, step * 2),
        hints: [`The numbers grow by the same amount each time.`, `Each step adds ${step}.`],
        explain: `The pattern counts up in ${step}s, so after ${seq[2]} comes ${ans}.`, dims: { understand: 2, fluent: 1 } };
    },
    addsub20(lv) {
      if (Math.random() < 0.5) { const a = ri(1, 10 + lv * 2), b = ri(1, 10); const ans = a + b;
        return { prompt: `${a} + ${b} = ?`, answer: String(ans), options: opts(ans, 3),
          hints: [`Start at ${a} and count up ${b}.`, `Break ${b} apart to make a ten.`],
          explain: `${a} + ${b} = ${ans}.`, dims: { fluent: 2 } }; }
      const a = ri(8, 20), b = ri(1, a - 1); const ans = a - b;
      return { prompt: `${a} − ${b} = ?`, answer: String(ans), options: opts(ans, 3),
        hints: [`Count back from ${a}.`, `Think: ${b} + ? = ${a}.`],
        explain: `${a} − ${b} = ${ans} because ${b} + ${ans} = ${a}.`, dims: { fluent: 2 } };
    },
    placevalue(lv) {
      const n = ri(100, lv > 3 ? 99999 : 9999);
      const digits = String(n).split("");
      const i = ri(0, digits.length - 1);
      const place = ["units", "tens", "hundreds", "thousands", "ten-thousands"][digits.length - 1 - i];
      const ans = Number(digits[i]) * Math.pow(10, digits.length - 1 - i);
      return { prompt: `In ${n.toLocaleString()}, what is the value of the digit ${digits[i]}?`, answer: String(ans), options: opts(ans, Math.max(ans, 10), (x)=>Number(x).toLocaleString()).map(String),
        hints: [`Which column is that digit in?`, `It sits in the ${place} place.`],
        explain: `The digit ${digits[i]} is in the ${place} place, so its value is ${ans.toLocaleString()}.`, dims: { understand: 2 } };
    },
    times(lv) {
      const a = ri(2, Math.min(12, 4 + lv)), b = ri(2, 12); const ans = a * b;
      return { prompt: `${a} × ${b} = ?`, answer: String(ans), options: opts(ans, a + 2),
        hints: [`${a} × ${b} means ${a} groups of ${b}.`, `Use a fact you know: ${a} × ${b > 1 ? b - 1 : b} + ${a}.`],
        explain: `${a} × ${b} = ${ans}.`, dims: { fluent: 2 } };
    },
    division(lv) {
      const b = ri(2, 12), q = ri(2, 9 + lv), a = b * q;
      return { prompt: `${a} ÷ ${b} = ?`, answer: String(q), options: opts(q, 3),
        hints: [`Division undoes multiplication.`, `Ask: ${b} × ? = ${a}.`],
        explain: `${b} × ${q} = ${a}, so ${a} ÷ ${b} = ${q}.`, dims: { fluent: 2, understand: 1 } };
    },
    integers(lv) {
      const a = ri(-12 - lv, 12 + lv), b = ri(-12, 12), op = pick(["+", "−"]);
      const ans = op === "+" ? a + b : a - b;
      const bs = b < 0 ? `(${b})` : b;
      return { prompt: `${a} ${op} ${bs} = ?`, answer: String(ans), options: opts(ans, 5),
        hints: [`Use a number line: negatives go left.`, op === "−" && b < 0 ? `Subtracting a negative means adding.` : `Watch the signs carefully.`].filter(Boolean),
        explain: `${a} ${op} ${bs} = ${ans}.`, dims: { fluent: 2, understand: 1 } };
    },
    fractions(lv) {
      const kind = pick(lv > 4 ? ["add", "of", "simplify"] : ["of", "simplify"]);
      if (kind === "of") { const d = pick([2, 3, 4, 5]), n = ri(1, d - 1), w = d * ri(2, 6);
        const ans = (w / d) * n;
        return { prompt: `What is ${n}⁄${d} of ${w}?`, answer: String(ans), options: opts(ans, 6),
          hints: [`First find 1⁄${d} of ${w}.`, `1⁄${d} of ${w} = ${w / d}; you need ${n} of those.`],
          explain: `${w} ÷ ${d} = ${w / d}, then × ${n} gives ${ans}.`, dims: { understand: 2, apply: 1 } }; }
      if (kind === "add") { const d = pick([4, 6, 8, 10]), n1 = ri(1, d - 2), n2 = ri(1, d - n1 - 1);
        const s = n1 + n2, g = gcd(s, d);
        const ans = g > 1 ? `${s / g}/${d / g}` : `${s}/${d}`;
        const wrong = [`${s}/${d * 2}`, `${n1 + n2}/${d + d}`, `${Math.max(1, s - 1)}/${d}`];
        return { prompt: `${n1}⁄${d} + ${n2}⁄${d} = ? (simplest form)`, answer: ans, options: shuffle([ans, ...wrong.filter((w) => w !== ans)].slice(0, 4)),
          hints: [`Same denominator: add only the tops.`, `${n1} + ${n2} = ${s}. Can ${s}⁄${d} be simplified?`],
          explain: `${n1}⁄${d} + ${n2}⁄${d} = ${s}⁄${d}${g > 1 ? ` = ${ans}` : ""}.`, dims: { fluent: 2, understand: 1 } }; }
      const g2 = pick([2, 3, 4, 5]), d2 = g2 * pick([2, 3, 4]), n2b = g2 * ri(1, Math.floor(d2 / g2) - 1);
      const gg = gcd(n2b, d2); const ans2 = `${n2b / gg}/${d2 / gg}`;
      return { prompt: `Simplify ${n2b}⁄${d2} fully.`, answer: ans2, options: shuffle([ans2, `${n2b}/${d2}`, `${Math.max(1, n2b / gg - 1)}/${d2 / gg}`, `${n2b / gg}/${Math.max(2, d2 / gg + 1)}`].slice(0, 4)),
        hints: [`Find the biggest number dividing both ${n2b} and ${d2}.`, `Both divide by ${gg}.`],
        explain: `÷${gg} on top and bottom: ${n2b}⁄${d2} = ${ans2}.`, dims: { fluent: 2 } };
    },
    percent(lv) {
      const p = pick(lv > 5 ? [12.5, 15, 35, 65, 85] : [10, 20, 25, 50, 75]), w = pick([40, 60, 80, 120, 200, 360]);
      const ans = Math.round((p / 100) * w * 100) / 100;
      return { prompt: `${p}% of ${w} = ?`, answer: String(ans), options: opts(ans, Math.max(4, ans / 3)),
        hints: [`${p}% means ${p} out of every 100.`, `Find 10% first: ${w / 10}.`],
        explain: `${p}% of ${w} = ${p / 100} × ${w} = ${ans}.`, dims: { apply: 2, fluent: 1 } };
    },
    exponents(lv) {
      if (lv > 5 && Math.random() < 0.5) { const b = pick([2, 3, 5, 10]), m = ri(2, 4), n = ri(1, 3);
        const ans = `${b}^${m + n}`;
        return { prompt: `Simplify: ${b}^${m} × ${b}^${n}`, answer: ans, options: shuffle([ans, `${b}^${m * n}`, `${b * 2}^${m + n}`, `${b}^${Math.abs(m - n) || 1}`].slice(0, 4)),
          hints: [`Same base: what happens to the exponents?`, `aᵐ × aⁿ = aᵐ⁺ⁿ.`],
          explain: `Add the exponents: ${b}^${m} × ${b}^${n} = ${b}^${m + n}.`, dims: { understand: 2, fluent: 1 } }; }
      const b = pick([2, 3, 4, 5, 10]), e = ri(2, b > 4 ? 3 : 4); const ans = Math.pow(b, e);
      return { prompt: `${b}^${e} = ?`, answer: String(ans), options: opts(ans, Math.max(4, ans / 4)),
        hints: [`${b}^${e} means ${b} multiplied by itself ${e} times.`, `Build it up: ${b}, ${b * b}…`],
        explain: `${b}^${e} = ${ans}.`, dims: { fluent: 2 } };
    },
    expressions(lv) {
      const a = ri(2, 5 + lv), b = ri(1, 9), x = ri(2, 9);
      const ans = a * x + b;
      return { prompt: `If x = ${x}, evaluate ${a}x + ${b}`, answer: String(ans), options: opts(ans, a + 3),
        hints: [`Replace x with ${x}.`, `${a} × ${x} = ${a * x}, then add ${b}.`],
        explain: `${a}(${x}) + ${b} = ${a * x} + ${b} = ${ans}.`, dims: { understand: 1, fluent: 2 } };
    },
    linear(lv) {
      const a = ri(2, Math.min(9, 2 + lv)), x = ri(2, 12), b = ri(1, 15);
      const c = a * x + b;
      if (lv > 6 && Math.random() < 0.4) { const d = ri(1, a - 1), e = (a - d) * x + b;
        return { prompt: `Solve: ${a}x + ${b} = ${d}x + ${e}`, answer: String(x), options: opts(x, 3),
          hints: [`Collect x terms on one side.`, `${a}x − ${d}x = ${a - d}x, and ${e} − ${b} = ${e - b}.`],
          explain: `${a - d}x = ${e - b}, so x = ${x}.`, dims: { reason: 2, fluent: 1 } }; }
      return { prompt: `Solve: ${a}x + ${b} = ${c}`, answer: String(x), options: opts(x, 3),
        hints: [`Undo +${b} first — subtract it from both sides.`, `${a}x = ${c - b}. Now divide both sides by ${a}.`],
        explain: `${a}x = ${c} − ${b} = ${c - b}, so x = ${(c - b)} ÷ ${a} = ${x}. Check: ${a}×${x}+${b}=${c} ✓`, dims: { understand: 1, fluent: 1, apply: 1 } };
    },
    inequality(lv) {
      const a = ri(2, 6), x = ri(2, 9), b = ri(1, 10); const c = a * x + b;
      const ans = `x > ${x}`;
      return { prompt: `Solve: ${a}x + ${b} > ${c}`, answer: ans, options: shuffle([ans, `x < ${x}`, `x > ${x + a}`, `x ≥ ${x}`]),
        hints: [`Solve it like an equation first.`, `${a}x > ${c - b} — dividing by a positive keeps the sign.`],
        explain: `${a}x > ${c - b} ⇒ x > ${x}. The sign only flips when ×/÷ by a negative.`, dims: { reason: 2 } };
    },
    sequence(lv) {
      if (lv > 5 && Math.random() < 0.5) { const r = pick([2, 3]), a = ri(1, 4); const seq = [a, a * r, a * r * r];
        const ans = a * r ** 3;
        return { prompt: `${seq.join(", ")}, … — next term?`, answer: String(ans), options: opts(ans, r * 3),
          hints: [`Each term is multiplied by the same number.`, `The ratio is ×${r}.`],
          explain: `Geometric with ratio ${r}: ${seq[2]} × ${r} = ${ans}.`, dims: { reason: 2, understand: 1 } }; }
      const d = ri(2, 4 + lv), a = ri(1, 12); const seq = [a, a + d, a + 2 * d, a + 3 * d];
      const ans = a + 4 * d;
      return { prompt: `${seq.join(", ")}, … — next term?`, answer: String(ans), options: opts(ans, d + 2),
        hints: [`Find the common difference between terms.`, `It adds ${d} each time.`],
        explain: `Arithmetic with difference ${d}: ${seq[3]} + ${d} = ${ans}.`, dims: { reason: 1, fluent: 1 } };
    },
    funceval(lv) {
      const m = ri(1, 4), c = ri(-6, 8), x = ri(-4, 6);
      if (lv > 6 && Math.random() < 0.4) { const a = ri(1, 3); const ans = a * x * x + c;
        return { prompt: `f(x) = ${a}x² ${c >= 0 ? "+" : "−"} ${Math.abs(c)}. Find f(${x}).`, answer: String(ans), options: opts(ans, 2 * Math.abs(x) + 3),
          hints: [`Square ${x} first: ${x}² = ${x * x}.`, `${a} × ${x * x} = ${a * x * x}, then adjust by ${c}.`],
          explain: `f(${x}) = ${a}(${x})² ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = ${ans}.`, dims: { fluent: 1, apply: 2 } }; }
      const ans = m * x + c;
      return { prompt: `f(x) = ${m}x ${c >= 0 ? "+" : "−"} ${Math.abs(c)}. Find f(${x}).`, answer: String(ans), options: opts(ans, m + 3),
        hints: [`Substitute x = ${x} into the rule.`, `${m} × ${x} = ${m * x}.`],
        explain: `f(${x}) = ${m}(${x}) ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = ${ans}.`, dims: { fluent: 2 } };
    },
    systems(lv) {
      const x = ri(1, 8), y = ri(1, 8);
      return { prompt: `x + y = ${x + y} and x − y = ${x - y}. Find x.`, answer: String(x), options: opts(x, 3),
        hints: [`Add the two equations together — y cancels.`, `2x = ${2 * x}.`],
        explain: `Adding: 2x = ${x + y} + ${x - y} = ${2 * x}, so x = ${x} (and y = ${y}).`, dims: { reason: 2, apply: 1 } };
    },
    quadratic(lv) {
      const r1 = ri(1, 6), r2 = ri(1, 6);
      const b = r1 + r2, c = r1 * r2;
      const ans = `x = ${Math.min(r1, r2)} or ${Math.max(r1, r2)}`;
      const w1 = `x = ${Math.min(r1, r2) - 1} or ${Math.max(r1, r2)}`;
      const w2 = `x = −${Math.min(r1, r2)} or −${Math.max(r1, r2)}`;
      const w3 = `x = ${b} or ${c}`;
      return { prompt: `Solve: x² − ${b}x + ${c} = 0`, answer: ans, options: shuffle([ans, w1, w2, w3].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)),
        hints: [`Find two numbers that multiply to ${c} and add to ${b}.`, `Try ${r1} and ${r2}: ${r1}×${r2}=${c}, ${r1}+${r2}=${b}.`],
        explain: `x² − ${b}x + ${c} = (x − ${r1})(x − ${r2}) = 0 ⇒ ${ans}.`, dims: { reason: 2, fluent: 1 } };
    },
    trig(lv) {
      const t = pick([[30, "sin", "1/2"], [60, "cos", "1/2"], [45, "tan", "1"], [30, "cos", "√3/2"], [60, "sin", "√3/2"], [0, "sin", "0"], [90, "sin", "1"]]);
      const wrong = ["1/2", "√3/2", "√2/2", "1", "0"].filter((w) => w !== t[2]);
      return { prompt: `${t[1]} ${t[0]}° = ?`, answer: t[2], options: shuffle([t[2], ...shuffle(wrong).slice(0, 3)]),
        hints: [`Picture the special triangles (30–60–90 and 45–45–90).`, `Remember the table of special angles.`],
        explain: `${t[1]} ${t[0]}° = ${t[2]} — a special-angle value worth memorising.`, dims: { fluent: 2, understand: 1 } };
    },
    geometry(lv) {
      const kind = pick(lv > 5 ? ["circle", "rect", "tri", "cyl"] : ["rect", "tri"]);
      if (kind === "rect") { const l = ri(3, 12), w = ri(2, 9); const ans = l * w;
        return { prompt: `Area of a ${l} × ${w} rectangle?`, answer: String(ans), options: opts(ans, l),
          hints: [`Area = length × width.`, `${l} × ${w}.`], explain: `A = ${l} × ${w} = ${ans} square units.`, dims: { apply: 2 } }; }
      if (kind === "tri") { const b = pick([4, 6, 8, 10, 12]), h = ri(3, 10); const ans = (b * h) / 2;
        return { prompt: `Triangle: base ${b}, height ${h}. Area?`, answer: String(ans), options: opts(ans, b),
          hints: [`A triangle is half a rectangle.`, `A = ½ × ${b} × ${h}.`], explain: `A = ½×${b}×${h} = ${ans}.`, dims: { apply: 2 } }; }
      if (kind === "cyl") { const r = ri(1, 5), h = ri(2, 10); const ans = `${r * r * h}π`;
        return { prompt: `Cylinder: radius ${r}, height ${h}. Volume (exact)?`, answer: ans, options: shuffle([ans, `${2 * r * h}π`, `${r * h}π`, `${r * r * h * 2}π`]),
          hints: [`V = area of circle × height.`, `V = πr²h = π×${r * r}×${h}.`], explain: `V = πr²h = ${ans}.`, dims: { apply: 2, understand: 1 } }; }
      const r = pick([2, 3, 5, 10]); const ans = `${r * r}π`;
      return { prompt: `Area of a circle with radius ${r} (exact)?`, answer: ans, options: shuffle([ans, `${2 * r}π`, `${r}π²`, `${r * r * 2}π`]),
        hints: [`A = πr².`, `r² = ${r * r}.`], explain: `A = πr² = ${ans}.`, dims: { fluent: 1, apply: 1 } };
    },
    probability(lv) {
      const kind = pick(["die", "cards", "bag"]);
      if (kind === "die") { const t = pick([["an even number", "1/2"], ["a 6", "1/6"], ["more than 4", "1/3"], ["less than 3", "1/3"], ["a prime", "1/2"]]);
        return { prompt: `One fair die. P(${t[0]}) = ?`, answer: t[1], options: shuffle([t[1], ...["1/6", "1/3", "1/2", "2/3", "5/6"].filter((x) => x !== t[1]).slice(0, 3)]),
          hints: [`Count favourable outcomes out of 6.`, `List them: which faces qualify?`],
          explain: `P = favourable/total = ${t[1]}.`, dims: { reason: 2 } }; }
      if (kind === "bag") { const r = ri(2, 5), b = ri(2, 5); const g = gcd(r, r + b); const ans = `${r / g}/${(r + b) / g}`;
        return { prompt: `A bag holds ${r} red and ${b} blue marbles. P(red) = ?`, answer: ans, options: shuffle([ans, `${r}/${b}`, `${b}/${r + b}`, `1/${r + b}`].filter((v, i, a) => a.indexOf(v) === i)),
          hints: [`Total marbles = ${r + b}.`, `P(red) = red / total.`],
          explain: `P(red) = ${r}/${r + b}${g > 1 ? ` = ${ans}` : ""}.`, dims: { reason: 1, apply: 1 } }; }
      return { prompt: `From a 52-card deck, P(a heart) = ?`, answer: "1/4", options: shuffle(["1/4", "1/13", "1/2", "13/26"]),
        hints: [`How many hearts in a deck?`, `13 hearts out of 52 cards.`],
        explain: `13/52 = 1/4.`, dims: { reason: 1, fluent: 1 } };
    },
    stats(lv) {
      const n = lv > 5 ? 5 : 4;
      const vals = Array.from({ length: n }, () => ri(2, 12));
      const sum = vals.reduce((a, b) => a + b, 0);
      if (sum % n !== 0) vals[0] += n - (sum % n);
      const mean = vals.reduce((a, b) => a + b, 0) / n;
      return { prompt: `Find the mean of ${vals.join(", ")}`, answer: String(mean), options: opts(mean, 3),
        hints: [`Add them all, then share equally.`, `Total = ${vals.reduce((a, b) => a + b, 0)}, divide by ${n}.`],
        explain: `Mean = ${vals.reduce((a, b) => a + b, 0)} ÷ ${n} = ${mean}.`, dims: { fluent: 1, apply: 1 } };
    },
    finance(lv) {
      const P = pick([1000, 2000, 5000, 10000]), r = pick([5, 10]), t = ri(2, 4);
      const A = Math.round(P * Math.pow(1 + r / 100, t));
      return { prompt: `R${P.toLocaleString()} invested at ${r}% compound interest for ${t} years ≈ ?`, answer: `R${A.toLocaleString()}`, options: shuffle([`R${A.toLocaleString()}`, `R${(P + (P * r * t) / 100).toLocaleString()}`, `R${Math.round(A * 1.1).toLocaleString()}`, `R${Math.round(A * 0.9).toLocaleString()}`]),
        hints: [`Compound: A = P(1 + i)ⁿ.`, `Each year multiplies by ${1 + r / 100}.`],
        explain: `A = ${P}(${1 + r / 100})^${t} ≈ R${A.toLocaleString()}. Simple interest would give only R${(P + (P * r * t) / 100).toLocaleString()}.`, dims: { apply: 2, reason: 1 } };
    },
    derivative(lv) {
      const n = ri(2, lv > 8 ? 5 : 3), a = ri(1, 6);
      const ans = `${a * n === 1 ? "" : a * n}x${n - 1 === 1 ? "" : "^" + (n - 1)}`;
      const w = [`${a}x^${n}`, `${a * n}x^${n}`, `${a * (n - 1) || 1}x^${Math.max(1, n - 2) === 1 ? "" : Math.max(1, n - 2)}`.replace("x^1", "x")];
      return { prompt: `d/dx ( ${a === 1 ? "" : a}x^${n} ) = ?`, answer: ans, options: shuffle([ans, ...w.filter((x) => x !== ans)].slice(0, 4)),
        hints: [`Power rule: bring the exponent down, reduce it by one.`, `${a} × ${n} = ${a * n}; new exponent ${n - 1}.`],
        explain: `d/dx(${a}x^${n}) = ${a}·${n}·x^${n - 1} = ${ans}.`, dims: { fluent: 2, understand: 1 } };
    },
    integral(lv) {
      const n = ri(1, 4), a = (n + 1) * ri(1, 3);
      const ans = `${a / (n + 1) === 1 ? "" : a / (n + 1)}x^${n + 1} + C`;
      return { prompt: `∫ ${a === 1 ? "" : a}x^${n} dx = ?`, answer: ans, options: shuffle([ans, `${a}x^${n + 1} + C`, `${a * n}x^${n - 1 || 1} + C`, `${a / (n + 1) === 1 ? "" : a / (n + 1)}x^${n} + C`].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4)),
        hints: [`Integration reverses the power rule.`, `Raise the exponent to ${n + 1}, divide by ${n + 1}.`],
        explain: `∫${a}x^${n}dx = ${a}/(${n + 1}) · x^${n + 1} + C = ${ans}. Never forget +C.`, dims: { fluent: 2, understand: 1 } };
    },
    complex(lv) {
      const a = ri(1, 6), b = ri(1, 6), c = ri(1, 6), d = ri(1, 6);
      const re = a + c, im = b + d;
      const ans = `${re} + ${im}i`;
      return { prompt: `(${a} + ${b}i) + (${c} + ${d}i) = ?`, answer: ans, options: shuffle([ans, `${re} + ${im - 1 || 2}i`, `${re + im}i`, `${re - 1} + ${im}i`]),
        hints: [`Add real parts and imaginary parts separately.`, `Real: ${a}+${c}. Imaginary: ${b}+${d}.`],
        explain: `Real ${a}+${c}=${re}; imaginary ${b}+${d}=${im} ⇒ ${ans}.`, dims: { fluent: 2, understand: 1 } };
    },
  };

  /* ---------- public API ---------- */
  function skillFor(gen) { return ATLAS.SKILLS.find((s) => s.gen === gen); }

  function generate(gen, lvl) {
    const g = GENS[gen] ? gen : "linear";
    const sk = skillFor(g);
    const level = lvl || (sk ? sk.lvl : 3);
    const q = GENS[g](level);
    q.gen = g;
    q.skillId = sk ? sk.id : "linear-eq";
    return q;
  }

  function skillState(id) {
    if (!S.skills[id]) S.skills[id] = { mastery: 0, attempts: 0, correct: 0, run: 0, due: 0, last: 0 };
    return S.skills[id];
  }

  function record(skillId, correct, dims) {
    touchStreak();
    const k = skillState(skillId);
    k.attempts++; S.totals.attempts++;
    if (correct) {
      k.correct++; S.totals.correct++; k.run++;
      S.totals.bestRun = Math.max(S.totals.bestRun, k.run);
      k.mastery = Math.min(100, Math.round(k.mastery + (100 - k.mastery) * 0.14));
      S.xp += 10 + Math.round(k.mastery / 20);
      if (k.mastery >= 80 && S.goal.done < S.goal.target && k.attempts >= 5) S.goal.done = Math.min(S.goal.target, S.goal.done + 1);
    } else {
      k.run = 0;
      k.mastery = Math.max(0, Math.round(k.mastery * 0.88));
      S.xp += 2; // effort still counts
    }
    // spaced review: stronger mastery -> longer interval
    const days = correct ? Math.max(1, Math.round(k.mastery / 18)) : 0.5;
    k.due = Date.now() + days * 864e5;
    k.last = Date.now();
    for (const d in dims || {}) S.passport[d] = Math.min(100, (S.passport[d] || 0) + dims[d] * (correct ? 0.6 : 0.15));
    checkBadges();
    save();
  }

  function checkBadges() {
    ATLAS.BADGES.forEach((b) => { if (!S.badges.includes(b.id) && b.test(S)) { S.badges.push(b.id); if (typeof window !== "undefined" && window.App && App.toast) App.toast(`${b.icon} Badge earned: ${b.name}!`); } });
  }

  function masteryBand(m) { return m >= 80 ? "secure" : m >= 45 ? "practising" : m > 0 ? "review" : "foundation"; }

  function reviewQueue() {
    const now = Date.now();
    return Object.entries(S.skills)
      .filter(([, k]) => k.attempts > 0 && (k.due <= now || k.mastery < 45))
      .map(([id]) => id)
      .slice(0, 8);
  }

  function currentPath() {
    // first not-yet-secure skill at or below chosen grade, walking prereqs
    const gradeIdx = ATLAS.GRADES.indexOf(S.settings.grade);
    const eligible = ATLAS.SKILLS.filter((s) => ATLAS.GRADES.indexOf(s.grade) <= gradeIdx);
    const target = eligible.find((s) => skillPct(s.id) < 80) || eligible[eligible.length - 1];
    const done = eligible.filter((s) => skillPct(s.id) >= 80).length;
    return { skill: target, pct: Math.round((done / Math.max(1, eligible.length)) * 100) };
  }
  function skillPct(id) { return S.skills[id] ? S.skills[id].mastery : 0; }

  function overallMastery() {
    const ks = Object.values(S.skills);
    if (!ks.length) return 0;
    return Math.round(ks.reduce((a, k) => a + k.mastery, 0) / ks.length);
  }

  function exportJSON() { return JSON.stringify(S, null, 2); }
  function importJSON(txt) { const obj = JSON.parse(txt); if (!obj || typeof obj !== "object" || !("xp" in obj)) throw new Error("Not an Atlas backup"); S = Object.assign(defaultState(), obj); save(); }
  function reset() { S = defaultState(); save(); }

  return { get state() { return S; }, save, touchStreak, generate, record, skillState, skillPct, masteryBand, reviewQueue, currentPath, overallMastery, exportJSON, importJSON, reset, ri, pick, shuffle };
})();
