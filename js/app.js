/* MATHALOID ATLAS — UI. MIT License. Runs 100% in your browser: no servers, no tracking, no accounts. */
"use strict";

const App = (() => {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (id) => `<svg class="ic"><use href="#${id}"/></svg>`;

  /* ---------------- toast ---------------- */
  function toast(msg) {
    const z = $("#toastZone");
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    z.appendChild(t);
    setTimeout(() => t.remove(), 3400);
  }

  /* ---------------- sound (WebAudio, generated locally — no downloads) ---------------- */
  let audioCtx = null;
  function blip(freq, dur, type) {
    if (!Engine.state.settings.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type || "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.08, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }
  const sfx = { right: () => { blip(660, 0.12); setTimeout(() => blip(880, 0.18), 90); }, wrong: () => blip(180, 0.25, "triangle"), click: () => blip(440, 0.06), win: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.18), i * 120)); } };

  /* ---------------- starfield ---------------- */
  function startStars() {
    const cv = $("#starfield"), ctx = cv.getContext("2d");
    let stars = [];
    function size() {
      cv.width = innerWidth; cv.height = innerHeight;
      stars = Array.from({ length: Math.min(220, Math.floor(innerWidth / 7)) }, () => ({
        x: Math.random() * cv.width, y: Math.random() * cv.height,
        r: Math.random() * 1.5 + 0.3, p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2,
      }));
    }
    size(); addEventListener("resize", size);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches || Engine.state.settings.reducedMotion;
    function frame(t) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const st of stars) {
        const a = still ? 0.7 : 0.35 + 0.45 * Math.abs(Math.sin(st.p + t * 0.0006 * st.s));
        ctx.globalAlpha = a;
        ctx.fillStyle = st.r > 1.2 ? "#cfe4ff" : "#ffffff";
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!still) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- radar chart ---------------- */
  function drawRadar(canvas, values, sizePx) {
    const dims = ["understand", "fluent", "apply", "reason", "create"];
    const colors = ["#4ee1ff", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"];
    const dpr = window.devicePixelRatio || 1;
    const baseW = sizePx || canvas.width;
    const baseH = Math.round(baseW * 0.875);
    canvas.width = baseW * dpr; canvas.height = baseH * dpr;
    canvas.style.width = baseW + "px"; canvas.style.height = baseH + "px";
    const ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr);
    const w = baseW, h = baseH;
    const cx = w / 2, cy = h / 2 + 4, R = Math.min(w, h) / 2 - 14;
    const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    ctx.strokeStyle = "rgba(145,165,255,.25)"; ctx.lineWidth = 1;
    for (let ring = 1; ring <= 3; ring++) {
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) { const [x, y] = pt(i % 5, (R * ring) / 3); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    for (let i = 0; i < 5; i++) { const [x, y] = pt(i, R); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.beginPath();
    dims.forEach((d, i) => { const v = Math.max(6, values[d] || 0) / 100; const [x, y] = pt(i, R * v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath();
    ctx.fillStyle = "rgba(78,225,255,.18)"; ctx.fill();
    ctx.strokeStyle = "#4ee1ff"; ctx.lineWidth = 2; ctx.stroke();
    dims.forEach((d, i) => { const v = Math.max(6, values[d] || 0) / 100; const [x, y] = pt(i, R * v); ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); });
  }

  /* ---------------- HUD ---------------- */
  function refreshHud() {
    const S = Engine.state;
    $("#hudStreak").textContent = S.streak.count;
    $("#hudXp").textContent = S.xp.toLocaleString();
    const q = Engine.reviewQueue();
    const rc = $("#reviewCount"); if (rc) rc.textContent = q.length || "0";
    const goal = $("#goalCount"); if (goal) goal.textContent = `${S.goal.done}/${S.goal.target}`;
    const badge = $("#goalBadge"); if (badge) badge.classList.toggle("is-done", S.goal.done >= S.goal.target);
    const path = Engine.currentPath();
    const pn = $("#pathName"); if (pn && path.skill) {
      pn.textContent = path.skill.name;
      $("#pathMeta").textContent = `Grade ${path.skill.grade} • ${(ATLAS.LENSES.find((l) => l.id === S.settings.lens) || {}).name || "CAPS"}`;
      $("#pathBar").style.width = path.pct + "%";
      $("#pathPct").textContent = path.pct + "%";
    }
    const radar = $("#homeRadar"); if (radar && $("#view-home").classList.contains("is-active")) drawRadar(radar, S.passport, 150);
  }

  /* ---------------- chat brain — Mathaloid Brain v2 (100% local · private · offline) ---------------- */
  let pendingQ = null;
  const gcd2 = (a, b) => (b ? gcd2(b, a % b) : Math.abs(a));
  const fmtN = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 1e6) / 1e6));
  function parseLin(side) {
    let a = 0, b = 0;
    const s = side.replace(/−/g, "-").replace(/\s+/g, "").replace(/\*/g, "");
    const terms = s.match(/[+-]?[^+-]+/g);
    if (!terms) return null;
    for (const t of terms) {
      const m = t.match(/^([+-]?)(\d*\.?\d*)x(?:\/(\d+\.?\d*))?$/);
      if (m) { let co = m[2] === "" ? 1 : parseFloat(m[2]); if (m[3]) co /= parseFloat(m[3]); a += m[1] === "-" ? -co : co; }
      else if (/^[+-]?\d+\.?\d*$/.test(t)) b += parseFloat(t);
      else return null;
    }
    return [a, b];
  }
  function parsePoly(expr) {
    const s = expr.replace(/−/g, "-").replace(/\s+/g, "").replace(/\*\*/g, "^").replace(/\*/g, "").replace(/²/g, "^2").replace(/³/g, "^3");
    const terms = s.match(/[+-]?[^+-]+/g);
    if (!terms) return null;
    const coefs = {};
    for (const t of terms) {
      const m = t.match(/^([+-]?)(\d*\.?\d*)x(?:\^(\d+))?$/);
      if (m) { const n = m[3] ? parseInt(m[3], 10) : 1; const co = (m[2] === "" ? 1 : parseFloat(m[2])) * (m[1] === "-" ? -1 : 1); coefs[n] = (coefs[n] || 0) + co; }
      else if (/^[+-]?\d+\.?\d*$/.test(t)) coefs[0] = (coefs[0] || 0) + parseFloat(t);
      else return null;
    }
    return coefs;
  }
  function polyStr(coefs) {
    const ks = Object.keys(coefs).map(Number).sort((p, q) => q - p);
    let out = "";
    for (const k of ks) {
      const c = coefs[k]; if (!c) continue;
      const sign = c < 0 ? (out ? " − " : "−") : out ? " + " : "";
      const ac = Math.abs(c);
      const coTxt = k > 0 && ac === 1 ? "" : fmtN(ac);
      out += sign + coTxt + (k === 0 ? "" : k === 1 ? "x" : "x^" + k);
    }
    return out || "0";
  }
  const EXPLAIN = [
    [/pythagoras|hypotenuse/, "📐 <b>Pythagoras' theorem</b>: in any right-angled triangle, <b>a² + b² = c²</b> — the squares on the two shorter sides add up to the square on the hypotenuse (the longest side). Example: 3-4-5 → 9 + 16 = 25 ✓"],
    [/trigonometry|\bsine\b|\bcosine\b|\btangent\b|soh\s*cah\s*toa|\bsin\b|\bcos\b|\btan\b/, "📏 <b>Trigonometry</b> links angles to side ratios in right-angled triangles. Remember <b>SOH CAH TOA</b>: sin = Opposite/Hypotenuse, cos = Adjacent/Hypotenuse, tan = Opposite/Adjacent. The trig cards live in Study → Trigonometry."],
    [/derivative|differentiat|gradient function/, "📈 A <b>derivative</b> measures how fast something changes — the gradient of a curve at a point. Power rule: d/dx of xⁿ = n·xⁿ⁻¹. Try me: type <b>differentiate 3x^2 + 5x − 4</b> and I'll do it step by step."],
    [/integral|integrat|anti.?derivative/, "∫ <b>Integration</b> is the reverse of differentiation — it adds up infinitely many tiny slices to find areas under curves. Power rule in reverse: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C. Explore it in Frontier → Model & Simulate."],
    [/logarithm|\blog\b|\bln\b/, "🪜 A <b>logarithm</b> answers: “what power do I raise the base to, to get this number?” log₂(8) = 3 because 2³ = 8. Logs turn multiplication into addition — that's why they tame huge numbers."],
    [/\bsurd\b|square root|√/, "🌱 A <b>surd</b> is a root you can't simplify to a whole number, like √2 — the decimal never ends and never repeats. Simplify by pulling out square factors: √50 = √(25×2) = 5√2."],
    [/probability|chance|dice|coin/, "🎲 <b>Probability</b> = favourable outcomes ÷ total outcomes, always between 0 (impossible) and 1 (certain). One die: P(6) = 1/6. Test it for real in Frontier → Code & Compute with the 100-dice demo."],
    [/mean|median|mode|average/, "📊 Three ways to describe a middle: <b>mean</b> = total ÷ count, <b>median</b> = middle value when sorted, <b>mode</b> = most common value. Outliers drag the mean but barely move the median — investigate in Data Desk."],
    [/\bratio\b|proportion/, "⚖️ A <b>ratio</b> compares parts: 2:3 means for every 2 of the first there are 3 of the second. Scale ratios by multiplying both sides; simplify by dividing by the HCF — just like fractions."],
    [/inequalit/, "↔️ An <b>inequality</b> is like an equation but with a range of answers: x + 3 > 7 → x > 4. Golden rule: multiplying or dividing both sides by a negative number <b>flips the sign</b>."],
    [/sequence|nth term|arithmetic series|geometric/, "🔢 A <b>sequence</b> follows a rule. Arithmetic adds a fixed difference (Tₙ = a + (n−1)d); geometric multiplies by a fixed ratio (Tₙ = arⁿ⁻¹). Crack rules like a detective in Play → Pattern Detective."],
    [/function\b|f\(x\)/, "🛠️ A <b>function</b> is a machine: input x, apply the rule, get one output f(x). f(x) = 2x + 1 sends 3 → 7. Pilot them in Play → Function Flight."],
    [/exponent|indices|index law|power law/, "⚡ <b>Exponent laws</b>: xᵃ × xᵇ = xᵃ⁺ᵇ, xᵃ ÷ xᵇ = xᵃ⁻ᵇ, (xᵃ)ᵇ = xᵃᵇ, and x⁰ = 1. Anything to the power 0 is 1 — because you've multiplied by it zero times."],
    [/area of a circle|circle area/, "⭕ <b>Area of a circle = πr²</b> where r is the radius. Picture unrolling the circle into thin rings — they stack into a triangle of base 2πr and height r."],
    [/circumference|perimeter of a circle/, "⭕ <b>Circumference = 2πr = πd</b> — the walk around a circle is always π times the walk across it. That's literally what π is."],
    [/\bvolume\b/, "📦 <b>Volume</b> measures 3D space: cuboid = l×w×h, cylinder = πr²h, sphere = (4/3)πr³, cone = (1/3)πr²h. Cones and pyramids are always ⅓ of their surrounding prism."],
    [/decimal/, "🔟 <b>Decimals</b> are fractions in base-10 clothing: 0.75 = 75/100 = 3/4. Each place to the right is ten times smaller — tenths, hundredths, thousandths."],
    [/what is a fraction|explain fraction|fraction.*mean/, "🍕 A <b>fraction</b> is a fair share: 3/4 means cut the whole into 4 equal parts and take 3. The bottom (denominator) names the part size; the top (numerator) counts them. Say <b>fraction challenge</b> to practise!"],
  ];
  const BOT = {
    greet: "Hi! I'm Mathaloid — your private, on-device maths brain. I can solve equations step by step (try 2x + 3 = x + 9, or x^2 − 5x + 6 = 0), differentiate polynomials, work out percentages and fractions, explain any concept, or quiz you at your level. Nothing you type ever leaves this device.",
    answer(text) {
      const t = text.toLowerCase().trim();
      if (pendingQ) {
        const correct = t.replace(/\s+/g, "") === String(pendingQ.answer).toLowerCase().replace(/\s+/g, "");
        const q = pendingQ; pendingQ = null;
        Engine.record(q.skillId, correct, q.dims);
        refreshHud();
        return correct ? `✅ Exactly right — <b>${esc(q.answer)}</b>! ${esc(q.explain)}\n\nWant another? Just say “next”.`
          : `Not quite — the answer is <b>${esc(q.answer)}</b>. ${esc(q.explain)}\n\nSay “next” to try another.`;
      }
      const cleaned = t.replace(/^solve\s*(for x)?:?\s*/, "").replace(/\s+/g, "");
      // quadratic: ax^2+bx+c=0 (also x²)
      if (/x\^2|x²/.test(cleaned) && cleaned.includes("=")) {
        const [lhs, rhs] = cleaned.split("=");
        const L = parsePoly(lhs), R = parsePoly(rhs);
        if (L && R) {
          const a = (L[2] || 0) - (R[2] || 0), b = (L[1] || 0) - (R[1] || 0), c = (L[0] || 0) - (R[0] || 0);
          if (a !== 0) {
            const D = b * b - 4 * a * c;
            let roots;
            if (D > 0) { const r1 = (-b + Math.sqrt(D)) / (2 * a), r2 = (-b - Math.sqrt(D)) / (2 * a); roots = `two real solutions: <b>x = ${fmtN(r1)}</b> or <b>x = ${fmtN(r2)}</b>`; }
            else if (D === 0) roots = `one repeated solution: <b>x = ${fmtN(-b / (2 * a))}</b>`;
            else roots = `no real solutions (D < 0). At A-Level: two complex roots x = ${fmtN(-b / (2 * a))} ± ${fmtN(Math.sqrt(-D) / (2 * a))}i`;
            return `Quadratic detected 🧮 Standard form: <b>${polyStr({ 2: a, 1: b, 0: c })} = 0</b>\n1) a = ${fmtN(a)}, b = ${fmtN(b)}, c = ${fmtN(c)}\n2) Discriminant D = b² − 4ac = ${fmtN(b)}² − 4(${fmtN(a)})(${fmtN(c)}) = <b>${fmtN(D)}</b>\n3) x = (−b ± √D) / 2a → ${roots}\nCheck by substituting back ✓`;
          }
        }
      }
      // linear with x on either side: ax+b = cx+d
      if (cleaned.includes("x") && cleaned.includes("=") && !/[<>]/.test(cleaned)) {
        const parts = cleaned.split("=");
        if (parts.length === 2) {
          const L = parseLin(parts[0]), R = parseLin(parts[1]);
          if (L && R) {
            const a = L[0] - R[0], b = R[1] - L[1];
            if (a !== 0) {
              const x = b / a;
              const steps = [];
              steps.push(`1) Start: <b>${esc(text.trim())}</b>`);
              if (R[0] !== 0) steps.push(`2) Move the x-terms to one side → ${fmtN(a)}x ${L[1] >= 0 ? "+ " + fmtN(L[1]) : "− " + fmtN(Math.abs(L[1]))} = ${fmtN(R[1])}`);
              steps.push(`${R[0] !== 0 ? 3 : 2}) Move the constants → ${fmtN(a)}x = ${fmtN(b)}`);
              steps.push(`${R[0] !== 0 ? 4 : 3}) Divide both sides by ${fmtN(a)} → <b>x = ${fmtN(x)}</b>`);
              return `Let's balance it like a scale ⚖️\n${steps.join("\n")}\nCheck it by substituting back ✓`;
            }
          }
        }
      }
      // pure arithmetic (fraction expressions like 1/2 + 1/3 are handled by the step-by-step solver below)
      if (!/^\d+\s*\/\s*\d+\s*[+\-×*÷]\s*\d+\s*\/\s*\d+$/.test(t) && /^[\d\s+\-*/().^%×÷]+$/.test(t) && /\d/.test(t)) {
        const v = safeCalc(t);
        if (v !== null) return `<b>${esc(t)} = ${v}</b>\nWant the why behind it? Ask me to explain any step.`;
      }
      // fraction arithmetic with steps
      const fr = t.match(/^(\d+)\s*\/\s*(\d+)\s*([+\-×*÷])\s*(\d+)\s*\/\s*(\d+)$/);
      if (fr) {
        const n1 = +fr[1], d1 = +fr[2], op = fr[3], n2 = +fr[4], d2 = +fr[5];
        let num, den, opTxt;
        if (op === "+" || op === "-") {
          den = (d1 * d2) / gcd2(d1, d2);
          const a1 = n1 * (den / d1), a2 = n2 * (den / d2);
          num = op === "+" ? a1 + a2 : a1 - a2;
          opTxt = `1) Common denominator: ${den} → ${a1}/${den} ${op} ${a2}/${den}\n2) ${op === "+" ? "Add" : "Subtract"} the tops → ${num}/${den}`;
        } else if (op === "×" || op === "*") { num = n1 * n2; den = d1 * d2; opTxt = `1) Multiply tops and bottoms → ${num}/${den}`; }
        else { num = n1 * d2; den = d1 * n2; opTxt = `1) Dividing = multiplying by the reciprocal → ${n1}/${d1} × ${d2}/${n2} = ${num}/${den}`; }
        const g = gcd2(num, den) || 1;
        const simp = g > 1 ? `\n${op === "+" || op === "-" ? 3 : 2}) Simplify by ÷${g} → <b>${num / g}/${den / g}</b>` : `\nAlready in simplest form: <b>${num}/${den}</b>`;
        return `Fraction work 🍰\n${opTxt}${simp}`;
      }
      // percentages
      let m = t.match(/(\d+\.?\d*)\s*%\s*of\s*(\d+\.?\d*)/);
      if (m) { const p = +m[1], n = +m[2]; return `💯 ${p}% of ${n}:\n1) Turn % into a decimal → ${p}% = ${fmtN(p / 100)}\n2) Multiply → ${fmtN(p / 100)} × ${n} = <b>${fmtN((p / 100) * n)}</b>`; }
      m = t.match(/(\d+\.?\d*)\s+(?:is what|as a)\s*percent(?:age)?\s*of\s*(\d+\.?\d*)/);
      if (m) { const a = +m[1], b = +m[2]; return `💯 ${a} out of ${b}:\n1) Divide → ${a} ÷ ${b} = ${fmtN(a / b)}\n2) ×100 → <b>${fmtN((a / b) * 100)}%</b>`; }
      m = t.match(/(increase|decrease)\s*(\d+\.?\d*)\s*by\s*(\d+\.?\d*)\s*%/);
      if (m) { const up = m[1] === "increase", n = +m[2], p = +m[3]; const f = up ? 1 + p / 100 : 1 - p / 100; return `💯 ${m[1][0].toUpperCase() + m[1].slice(1)} ${n} by ${p}%:\n1) Multiplier = ${up ? "1 +" : "1 −"} ${fmtN(p / 100)} = ${fmtN(f)}\n2) ${n} × ${fmtN(f)} = <b>${fmtN(n * f)}</b>\nOne multiplier beats two steps — that's the exam trick.`; }
      // derivative of a polynomial
      m = t.match(/^(?:differentiate|derivative of|find the derivative of|d\/dx(?:\s*of)?)\s*(.+)$/);
      if (m) {
        const coefs = parsePoly(m[1]);
        if (coefs) {
          const dcoefs = {}; const steps = [];
          for (const k of Object.keys(coefs).map(Number).sort((p, q) => q - p)) {
            const c = coefs[k]; if (!c) continue;
            if (k === 0) { steps.push(`d/dx(${fmtN(c)}) = 0 (constants vanish)`); continue; }
            dcoefs[k - 1] = (dcoefs[k - 1] || 0) + c * k;
            steps.push(`d/dx(${polyStr({ [k]: c })}) = ${polyStr({ [k - 1]: c * k })}  (power rule: bring down ${k}, drop the power by 1)`);
          }
          return `📈 Differentiating <b>${polyStr(coefs)}</b>:\n${steps.map((s, i) => `${i + 1}) ${s}`).join("\n")}\nResult: <b>f′(x) = ${polyStr(dcoefs)}</b>`;
        }
      }
      // expand (x+a)(x+b)
      m = t.replace(/\s+/g, "").match(/^expand\(x([+-]\d+)\)\(x([+-]\d+)\)$/);
      if (m) { const a = +m[1], b = +m[2]; return `🧩 FOIL — First, Outer, Inner, Last:\n1) x·x = x²\n2) x·${b} + ${a}·x = ${fmtN(a + b)}x\n3) ${a} × ${b} = ${fmtN(a * b)}\nResult: <b>${polyStr({ 2: 1, 1: a + b, 0: a * b })}</b>`; }
      // gcd / lcm
      m = t.match(/\b(gcd|hcf|highest common factor|lcm|lowest common multiple)\b\D*(\d+)\D+(\d+)/);
      if (m) {
        const a = +m[2], b = +m[3], g = gcd2(a, b);
        if (/lcm|lowest/.test(m[1])) return `🔗 LCM of ${a} and ${b}:\n1) HCF first → ${g}\n2) LCM = (${a} × ${b}) ÷ HCF = ${a * b} ÷ ${g} = <b>${(a * b) / g}</b>`;
        return `🔗 HCF of ${a} and ${b} (Euclid's shortcut — divide and take remainders):\n<b>HCF = ${g}</b>\nBonus: LCM = (${a}×${b})÷${g} = ${(a * b) / g}`;
      }
      // prime check / factors
      m = t.match(/is\s+(\d+)\s+(?:a\s+)?prime/);
      if (m) { const n = +m[1]; if (n < 2) return `${n} is <b>not prime</b> — primes start at 2.`; let d = 0; for (let i = 2; i * i <= n; i++) if (n % i === 0) { d = i; break; } return d ? `${n} is <b>not prime</b> — it divides by ${d} (${n} = ${d} × ${n / d}).` : `✨ Yes — <b>${n} is prime</b>! Its only factors are 1 and ${n}.`; }
      m = t.match(/(?:prime factors?|factorise|factorize|factors?) of\s*(\d+)/);
      if (m) { let n = +m[1]; const fs = []; for (let i = 2; i * i <= n; i++) while (n % i === 0) { fs.push(i); n /= i; } if (n > 1) fs.push(n); return `🌳 Prime factor tree of ${m[1]}:\n<b>${m[1]} = ${fs.join(" × ")}</b>${fs.length === 1 ? " (it's prime!)" : ""}`; }
      // times table
      m = t.match(/(\d+)\s*times table/);
      if (m) { const n = +m[1]; return `🎵 The ${n} times table:\n` + Array.from({ length: 12 }, (_, i) => `${n} × ${i + 1} = <b>${n * (i + 1)}</b>`).join("\n"); }
      // concept explainers
      if (/linear equation|solve.*equation|equation.*solve/.test(t)) return `A <b>linear equation</b> is a balance scale: whatever you do to one side, do to the other.\nExample: 3x + 7 = 22 → subtract 7 (3x = 15) → divide by 3 (<b>x = 5</b>).\n\n📘 I've got a full lesson with a balance model — open <b>Learn</b>, or say “quiz me” to practise now. You can also paste any equation, even with x on both sides.`;
      if (/quadratic formula|quadratic/.test(t)) return `The <b>quadratic formula</b> solves ax² + bx + c = 0:\n<b>x = (−b ± √(b² − 4ac)) / 2a</b>\nThe part under the root, b²−4ac, is the <b>discriminant</b> — it counts the real solutions. Paste one (like x^2 − 5x + 6 = 0) and I'll solve it step by step.`;
      for (const [re, msg] of EXPLAIN) if (re.test(t)) return msg;
      if (/fraction/.test(t)) { pendingQ = Engine.generate("fractions"); return `🔥 Fraction challenge:\n<b>${esc(pendingQ.prompt)}</b>\nType your answer!`; }
      if (/\bpi\b|π/.test(t)) return `🥧 Imagine any circle. Walk once around it (that's the circumference), then walk straight across the middle (the diameter). The walk around is always about <b>3.14 times</b> longer — no matter the size of the circle! That magic number is <b>π</b>.`;
      if (/quiz|challenge|practice|test me|next|another/.test(t)) {
        const gens = ["linear", "fractions", "sequence", "percent", "exponents", "funceval"];
        pendingQ = Engine.generate(gens[Math.floor(Math.random() * gens.length)]);
        return `🎯 Here we go:\n<b>${esc(pendingQ.prompt)}</b>\nType your answer — or say “hint”.`;
      }
      if (/hint/.test(t)) return pendingQ ? `💡 ${esc(pendingQ.hints[0])}` : `Ask me for a quiz first, then I'll drop hints when you need them.`;
      if (/grade\s*(\d+)/.test(t)) { const g = t.match(/grade\s*(\d+)/)[1]; Engine.state.settings.grade = g; Engine.save(); refreshHud(); return `Locked in — I'll aim content at <b>Grade ${g}</b>. Say “quiz me” and I'll match the level, or open Pathfinder for your recommended route.`; }
      if (/help|what can you do/.test(t)) return BOT.greet;
      if (/hello|hi\b|hey/.test(t)) return `Hello, Explorer! 👋 Ready to bend some numbers? Say “quiz me”, ask about any concept, or paste an equation — I can even handle x on both sides now.`;
      return `Interesting! Try me with:\n• <b>2x + 3 = x + 9</b> or <b>x^2 − 5x + 6 = 0</b> — step-by-step solving\n• <b>differentiate 3x^2 + 5x</b> — calculus\n• <b>15% of 80</b>, <b>1/2 + 1/3</b>, <b>hcf of 24 and 36</b>\n• “what is Pythagoras?” — concept explainers\n• “quiz me for grade 9” — adaptive practice`;
    },
  };
  function safeCalc(expr) {
    try {
      let e = expr.replace(/\^/g, "**").replace(/÷/g, "/").replace(/×/g, "*");
      if (!/^[\d\s+\-*/().%*]+$/.test(e)) return null;
      const v = Function('"use strict";return (' + e + ")")();
      if (typeof v !== "number" || !isFinite(v)) return null;
      return Math.round(v * 1e6) / 1e6;
    } catch (err) { return null; }
  }

  function pushMsg(role, html, log) {
    log = log || $("#chatLog");
    const div = document.createElement("div");
    div.className = "msg " + role;
    div.innerHTML = html;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function initChat() {
    const log = $("#chatLog");
    pushMsg("user", "Help me understand solving linear equations", log);
    pushMsg("bot", "Great choice! A <b>linear equation</b> is like a balance scale — keep both sides equal while you isolate x. Try: 3x + 7 = 22 → 3x = 15 → <b>x = 5</b>. Want a full lesson or a quick quiz?", log);
    const chips = $("#chatChips");
    ATLAS.CHAT_SUGGESTIONS.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = s;
      b.addEventListener("click", () => { $("#chatInput").value = s; $("#chatForm").requestSubmit(); });
      chips.appendChild(b);
    });
    $("#chatForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = $("#chatInput");
      const text = inp.value.trim();
      if (!text) return;
      pushMsg("user", esc(text));
      inp.value = "";
      sfx.click();
      setTimeout(() => { const reply = BOT.answer(text); pushMsg("bot", reply); speakMaybe(reply); }, 260);
    });
    hookMic($("#chatMic"), (text) => { $("#chatInput").value = text; $("#chatForm").requestSubmit(); });
  }

  /* ---------------- speech ---------------- */
  function hookMic(btn, onResult) {
    if (!btn) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { btn.addEventListener("click", () => toast("🎙️ Voice input isn't supported in this browser — typing works everywhere!")); return; }
    let rec = null;
    btn.addEventListener("click", () => {
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = "en-ZA";
      rec.onresult = (e) => onResult(e.results[0][0].transcript);
      rec.onend = () => { btn.classList.remove("is-live"); rec = null; };
      rec.onerror = () => { btn.classList.remove("is-live"); rec = null; toast("Couldn't hear that — try again."); };
      btn.classList.add("is-live");
      rec.start();
    });
  }
  function speakMaybe(html) {
    if (!Engine.state.settings.speak || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(html.replace(/<[^>]+>/g, "").replace(/\n/g, ". "));
    u.rate = 1.02;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }

  /* ---------------- focus timer ---------------- */
  const focus = { total: 25 * 60, left: 25 * 60, timer: null };
  function fmtTime(s) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
  function focusTick() {
    focus.left--;
    if (focus.left <= 0) {
      clearInterval(focus.timer); focus.timer = null; focus.left = focus.total;
      Engine.state.totals.focusSessions++; Engine.state.xp += 50; Engine.save();
      sfx.win(); toast("⏱️ Focus session complete — +50 XP!");
      $("#focusStart").textContent = "Start";
      refreshHud();
    }
    $("#focusTime").textContent = fmtTime(focus.left);
    const c = 226;
    $("#focusArc").style.strokeDashoffset = c - (c * focus.left) / focus.total;
  }
  function initFocus() {
    $("#focusStart").addEventListener("click", () => {
      if (focus.timer) { clearInterval(focus.timer); focus.timer = null; $("#focusStart").textContent = "Resume"; }
      else { focus.timer = setInterval(focusTick, 1000); $("#focusStart").textContent = "Pause"; sfx.click(); }
    });
  }

  /* ---------------- quiz runner (shared by Play / Arena / Exam / Learn) ---------------- */
  function runQuiz(host, cfg) {
    const state = { i: 0, right: 0, hintsUsed: 0, run: 0, over: false, endAt: cfg.seconds ? Date.now() + cfg.seconds * 1000 : null };
    let clock = null;
    function q() { return state.q; }
    function next() {
      if ((cfg.count && state.i >= cfg.count) || (state.endAt && Date.now() >= state.endAt)) return finish();
      const gen = cfg.gens[Math.floor(Math.random() * cfg.gens.length)];
      const sk = ATLAS.SKILLS.find((s) => s.gen === gen);
      const lvl = Math.min(10, (sk ? sk.lvl : 3) + (cfg.levelBoost || 0) + Math.floor(Engine.skillPct(sk ? sk.id : "") / 40));
      state.q = Engine.generate(gen, lvl);
      state.hintIdx = 0;
      render();
    }
    function finish() {
      state.over = true;
      if (clock) clearInterval(clock);
      const pct = state.i ? Math.round((state.right / state.i) * 100) : 0;
      sfx.win();
      if (cfg.onDone) cfg.onDone({ right: state.right, total: state.i, pct });
      host.innerHTML = `<div class="panel q-card">
        <p class="muted" style="margin:0">${esc(cfg.title || "Session complete")}</p>
        <p class="q-prompt">${pct >= 80 ? "🌟" : pct >= 50 ? "💪" : "🌱"} ${state.right}/${state.i} correct — ${pct}%</p>
        <p class="muted">${pct >= 80 ? "Outstanding — mastery is growing fast." : pct >= 50 ? "Solid work. Review the tricky ones and go again." : "Every attempt teaches your brain something. Try the hints next round!"}</p>
        <div class="kbd-row" style="justify-content:center; margin-top:10px">
          <button class="btn" data-again>Play Again</button>
          <button class="btn btn-ghost" data-close>Done</button>
        </div></div>`;
      $("[data-again]", host).addEventListener("click", () => { Object.assign(state, { i: 0, right: 0, over: false, endAt: cfg.seconds ? Date.now() + cfg.seconds * 1000 : null }); next(); });
      $("[data-close]", host).addEventListener("click", () => { if (cfg.onClose) cfg.onClose(); });
      refreshHud();
    }
    function render() {
      const Q = q();
      const clockBit = cfg.seconds ? ' • <b data-clock></b>' : '';
      host.innerHTML = `<div class="panel q-card">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap">
          <span class="pill">${esc(cfg.title || "Practice")}</span>
          <span class="muted" style="font-size:12.5px">Q${state.i + 1}${cfg.count ? " / " + cfg.count : ""} • ${state.right} correct${clockBit}</span>
        </div>
        <p class="q-prompt">${esc(Q.prompt)}</p>
        <div class="q-opts">${Q.options.map((o) => `<button class="q-opt" data-a="${esc(o)}">${esc(o)}</button>`).join("")}</div>
        <div class="feedback" aria-live="polite"></div>
        <div class="kbd-row" style="justify-content:center">
          <button class="pill pill-btn" data-hint>💡 Hint</button>
          <button class="pill pill-btn" data-skip>Skip</button>
        </div>
        <div class="hint-box" hidden></div>
      </div>`;
      if (cfg.seconds) updateClock();
      $$(".q-opt", host).forEach((b) => b.addEventListener("click", () => answer(b)));
      $("[data-hint]", host).addEventListener("click", () => {
        const box = $(".hint-box", host);
        box.hidden = false;
        box.textContent = "💡 " + Q.hints[Math.min(state.hintIdx, Q.hints.length - 1)];
        state.hintIdx++; state.hintsUsed++;
      });
      $("[data-skip]", host).addEventListener("click", () => { Engine.record(Q.skillId, false, Q.dims); state.i++; next(); });
    }
    function answer(btn) {
      const Q = q();
      const correct = btn.dataset.a === String(Q.answer);
      $$(".q-opt", host).forEach((b) => { b.disabled = true; if (b.dataset.a === String(Q.answer)) b.classList.add("is-right"); });
      if (!correct) btn.classList.add("is-wrong");
      correct ? sfx.right() : sfx.wrong();
      Engine.record(Q.skillId, correct, Q.dims);
      if (correct) state.right++;
      state.i++;
      $(".feedback", host).innerHTML = correct ? `<b style="color:var(--green)">Correct! +${10 + Math.round(Engine.skillPct(Q.skillId) / 20)} XP</b><div class="why">${esc(Q.explain)}</div>` : `<b style="color:var(--red)">Answer: ${esc(Q.answer)}</b><div class="why">${esc(Q.explain)}</div>`;
      refreshHud();
      setTimeout(next, correct ? 1100 : 2400);
    }
    function updateClock() {
      const el = $("[data-clock]", host);
      if (el && state.endAt) el.textContent = fmtTime(Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000)));
    }
    if (cfg.seconds) clock = setInterval(() => { updateClock(); if (state.endAt && Date.now() >= state.endAt && !state.over) finish(); }, 500);
    next();
    return { stop: () => clock && clearInterval(clock) };
  }

  /* ================= VIEW RENDERERS ================= */
  const VIEWS = {};

  /* ---------- Pathfinder ---------- */
  VIEWS.pathfinder = (el) => {
    const S = Engine.state;
    const path = Engine.currentPath();
    const review = Engine.reviewQueue();
    const gradeIdx = ATLAS.GRADES.indexOf(S.settings.grade);
    const route = ATLAS.SKILLS.filter((s) => ATLAS.GRADES.indexOf(s.grade) <= gradeIdx).slice(-8);
    el.innerHTML = `<div class="page" style="--ac:var(--cyan)">
      <div class="page-head"><h2>${icon("i-map")} Pathfinder</h2><span class="spacer"></span>
        ${ATLAS.LENSES.map((l) => `<button class="pill pill-btn" data-lens="${l.id}" aria-pressed="${S.settings.lens === l.id}" title="${esc(l.note)}">${l.name}</button>`).join("")}
        <select id="pfGrade" aria-label="Grade">${ATLAS.GRADES.map((g) => `<option value="${g}" ${g === S.settings.grade ? "selected" : ""}>${g === "AS" || g === "A2" ? "A Level " + g : "Grade " + g}</option>`).join("")}</select>
        <p class="sub">Your personal route through the Atlas — no ceilings, no floors. Change lens or grade any time; nothing is locked.</p></div>
      <div class="grid grid-side-r">
        <div class="panel">
          <h3>${icon("i-compass")} Recommended route</h3>
          <ul class="list" id="pfRoute">${route.map((s) => { const m = Engine.skillPct(s.id); const band = Engine.masteryBand(m); const col = { secure: "var(--green)", practising: "var(--cyan)", review: "var(--gold)", foundation: "var(--muted)" }[band];
            return `<li><span style="width:10px;height:10px;border-radius:50%;background:${col};box-shadow:0 0 8px ${col}"></span><b>${esc(s.name)}</b><span class="muted" style="font-size:11.5px">Gr ${s.grade} • ${s.strand}</span><span class="spacer"></span><span class="muted">${m}%</span><button class="pill pill-btn" data-practise="${s.gen}">Practise</button></li>`; }).join("")}</ul>
        </div>
        <div style="display:flex; flex-direction:column; gap:14px">
          <div class="panel"><h4>Next up</h4><p style="margin:4px 0 2px; font-weight:800; font-size:16px">${esc(path.skill.name)}</p><p class="muted" style="margin:0 0 10px; font-size:12.5px">Grade ${path.skill.grade} • ${path.skill.strand}</p><div class="bar"><span style="width:${Engine.skillPct(path.skill.id)}%"></span></div><button class="btn" style="margin-top:12px" data-practise="${path.skill.gen}">Start now</button></div>
          <div class="panel"><h4>Review due</h4><p class="muted" style="font-size:13px; margin:4px 0 10px">${review.length ? review.length + " skill" + (review.length > 1 ? "s" : "") + " ready for spaced review — quick wins for your memory." : "Nothing due — your memory is fresh! 🌟"}</p>${review.length ? `<button class="btn btn-amber btn-mini" id="pfReview">Review now</button>` : ""}</div>
          <div class="panel"><h4>Curriculum lens</h4><p class="muted" style="font-size:12.5px; margin:4px 0 0">${esc((ATLAS.LENSES.find((l) => l.id === S.settings.lens) || {}).note || "")}. The Atlas maps every skill across CAPS, IEB and Cambridge — switch lenses to see the same mathematics through a different exam's eyes.</p></div>
        </div>
      </div>
      <div class="panel" style="margin-top:14px" id="pfQuiz" hidden></div>
    </div>`;
    $$("[data-lens]", el).forEach((b) => b.addEventListener("click", () => { S.settings.lens = b.dataset.lens; Engine.save(); VIEWS.pathfinder(el); refreshHud(); }));
    $("#pfGrade", el).addEventListener("change", (e) => { S.settings.grade = e.target.value; Engine.save(); VIEWS.pathfinder(el); refreshHud(); });
    $$("[data-practise]", el).forEach((b) => b.addEventListener("click", () => { const host = $("#pfQuiz", el); host.hidden = false; host.scrollIntoView({ behavior: "smooth" }); runQuiz(host, { gens: [b.dataset.practise], count: 8, title: "Pathfinder practice", onClose: () => { host.hidden = true; VIEWS.pathfinder(el); } }); }));
    const pr = $("#pfReview", el); if (pr) pr.addEventListener("click", () => { const gens = review.map((id) => (ATLAS.SKILLS.find((s) => s.id === id) || {}).gen).filter(Boolean); const host = $("#pfQuiz", el); host.hidden = false; runQuiz(host, { gens: gens.length ? gens : ["linear"], count: 8, title: "Spaced review", onClose: () => VIEWS.pathfinder(el) }); });
  };

  /* ---------- Learn ---------- */
  VIEWS.learn = (el, param) => {
    const S = Engine.state;
    const lesson = ATLAS.LESSONS.find((l) => l.id === param) || ATLAS.LESSONS[0];
    const stepIdx = Math.min(S.lessonProgress[lesson.id] || 0, lesson.steps.length - 1);
    const pct = Math.round(((stepIdx + 1) / lesson.steps.length) * 100);
    const step = lesson.content[stepIdx];
    el.innerHTML = `<div class="page" style="--ac:var(--green)">
      <div class="page-head"><h2>${icon("i-cube")} Learn</h2><span class="spacer"></span><span class="pill">${esc(lesson.grade)}</span>
        <p class="sub">Concepts taught the way brains like it: idea → examples → your turn → challenge.</p></div>
      <div class="grid grid-side">
        <div style="display:flex; flex-direction:column; gap:14px">
          <div class="panel"><h4>Lessons</h4><ul class="list">${ATLAS.LESSONS.map((l) => `<li style="cursor:pointer; ${l.id === lesson.id ? "border-color:var(--green)" : ""}" data-lesson="${l.id}"><b>${esc(l.title)}</b></li>`).join("")}</ul></div>
          <div class="panel"><h4>Lesson steps</h4><ul class="list">${lesson.steps.map((s, i) => `<li data-step="${i}" style="cursor:pointer; ${i === stepIdx ? "border-color:var(--cyan)" : ""}"><span class="muted">${i + 1}</span> ${esc(s)} ${i < stepIdx ? '<span class="spacer"></span>✓' : ""}</li>`).join("")}</ul></div>
        </div>
        <div class="panel">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap">
            <h3 style="margin:0">${esc(lesson.title)}</h3>
            <span style="display:flex; align-items:center; gap:8px; min-width:160px"><span class="bar" style="flex:1"><span style="width:${pct}%"></span></span><b style="font-size:12.5px">${pct}%</b></span>
          </div>
          <p class="muted" style="font-size:13px">Step ${stepIdx + 1} of ${lesson.steps.length} — <b>${esc(step.t)}</b></p>
          ${lesson.id === "linear-eq" && stepIdx < 4 ? balanceHTML(lesson.balance) : ""}
          <div id="lessonBody">${step.practice ? `<div id="lessonQuiz"></div>` : `<p style="font-size:15px; line-height:1.65">${step.body}</p>`}</div>
          <div class="kbd-row" style="margin-top:14px">
            <button class="btn btn-ghost btn-mini" id="stepPrev" ${stepIdx === 0 ? "disabled" : ""}>← Back</button>
            <button class="btn btn-mini" id="stepNext">${stepIdx >= lesson.steps.length - 1 ? "Finish lesson 🎉" : "Continue →"}</button>
            <span class="spacer"></span>
            <button class="pill pill-btn" id="lessonExplain">Explain differently</button>
            <button class="pill pill-btn" data-go-practise="${(ATLAS.SKILLS.find((s) => s.id === lesson.skill) || {}).gen || "linear"}">More practice</button>
          </div>
          <div class="hint-box" id="lessonAlt" hidden></div>
        </div>
      </div>
    </div>`;
    function balanceHTML(b) {
      if (!b) return "";
      return `<div class="balance" aria-label="Balance model of ${esc(b.left)} = ${esc(b.right)}">
        <div class="pan"><span class="tile tile-x">x</span><span class="tile tile-x">x</span><span class="tile tile-x">x</span>${"<span class=\"tile tile-1\">+1</span>".repeat(7)}</div>
        <b style="font-size:22px; padding-bottom:14px">=</b>
        <div class="pan">${"<span class=\"tile tile-10\">+10</span>".repeat(2)}<span class="tile tile-1">+1</span><span class="tile tile-1">+1</span></div>
      </div><p class="muted" style="text-align:center; font-size:12.5px; margin:4px 0 14px">⚖️ 3x + 7 = 22 — keep the scale balanced while you isolate x</p>`;
    }
    if (step.practice) runQuiz($("#lessonQuiz", el), { gens: [step.practice], count: 5, title: step.t === "Challenge" ? "Challenge round" : "Your turn", onClose: () => VIEWS.learn(el, lesson.id) });
    $$("[data-lesson]", el).forEach((b) => b.addEventListener("click", () => VIEWS.learn(el, b.dataset.lesson)));
    $$("[data-step]", el).forEach((b) => b.addEventListener("click", () => { S.lessonProgress[lesson.id] = Number(b.dataset.step); Engine.save(); VIEWS.learn(el, lesson.id); }));
    $("#stepPrev", el).addEventListener("click", () => { S.lessonProgress[lesson.id] = Math.max(0, stepIdx - 1); Engine.save(); VIEWS.learn(el, lesson.id); });
    $("#stepNext", el).addEventListener("click", () => {
      if (stepIdx >= lesson.steps.length - 1) { S.lessonProgress[lesson.id] = 0; Engine.state.xp += 30; Engine.save(); sfx.win(); toast("🎉 Lesson complete — +30 XP!"); refreshHud(); location.hash = "#journey"; return; }
      S.lessonProgress[lesson.id] = stepIdx + 1; Engine.save(); VIEWS.learn(el, lesson.id);
    });
    $("#lessonExplain", el).addEventListener("click", () => {
      const alt = $("#lessonAlt", el); alt.hidden = false;
      alt.innerHTML = `🤖 <b>Mathaloid says:</b> ${lesson.id === "linear-eq" ? "Think of x as a locked box. The equation tells you what everything weighs together. Peel away what you know (the +7), then share what's left equally among the boxes." : lesson.id === "fractions" ? "Picture a chocolate bar. The denominator says how many pieces you cut; the numerator says how many you eat. Equivalent fractions? Same amount of chocolate, cut differently!" : lesson.id === "quadratics" ? "A quadratic is a story of a ball thrown in the air — up, over, down. Solving it asks: when is the ball at height zero?" : "The derivative is a speedometer for any quantity — it reads how fast things change at this exact instant."}`;
    });
    $$("[data-go-practise]", el).forEach((b) => b.addEventListener("click", () => { sessionStorage.setItem("arena.gens", b.dataset.goPractise); location.hash = "#arena"; }));
  };

  /* ---------- Play ---------- */
  VIEWS.play = (el, param) => {
    const game = ATLAS.GAMES.find((g) => g.id === param);
    if (game) {
      const lvl = gameLevel(game);
      el.innerHTML = `<div class="page" style="--ac:var(--orange)">
        <div class="page-head"><h2>${icon(game.icon)} ${esc(game.name)}</h2><span class="spacer"></span><span class="pill">Level ${lvl}</span><a class="pill" href="#play">← All games</a>
        <p class="sub">${esc(game.desc)} Every answer updates your Passport — hints teach, mistakes coach.</p></div>
        <div id="gameHost"></div></div>`;
      runQuiz($("#gameHost", el), { gens: game.gens, count: 10, levelBoost: Math.floor(lvl / 3), title: `${game.name} • Lv ${lvl}`, onClose: () => (location.hash = "#play"), onDone: (r) => { if (r.pct >= 80) toast(`🎮 ${game.name} level up!`); } });
      return;
    }
    el.innerHTML = `<div class="page" style="--ac:var(--orange)">
      <div class="page-head"><h2>${icon("i-gamepad")} Play</h2>
        <p class="sub">Games that teach — each one trains real curriculum skills and levels up as you do.</p></div>
      <div class="grid grid-3">${ATLAS.GAMES.map((g) => `<button class="game-tile" style="--oc:var(--${g.color})" data-game="${g.id}">
        <span class="orb-bubble">${icon(g.icon)}</span><b>${esc(g.name)}</b><span class="lvl">Level ${gameLevel(g)}</span><span class="desc">${esc(g.desc)}</span></button>`).join("")}</div>
    </div>`;
    $$("[data-game]", el).forEach((b) => b.addEventListener("click", () => { location.hash = "#play/" + b.dataset.game; }));
  };
  function gameLevel(game) {
    const ms = game.gens.map((gen) => { const sk = ATLAS.SKILLS.find((s) => s.gen === gen); return sk ? Engine.skillPct(sk.id) : 0; });
    return Math.max(1, Math.min(10, 1 + Math.round((ms.reduce((a, b) => a + b, 0) / ms.length / 100) * 9)));
  }

  /* ---------- Journey ---------- */
  VIEWS.journey = (el) => {
    const S = Engine.state;
    const bandCol = { secure: "#34d399", practising: "#4ee1ff", review: "#fbbf24", foundation: "#f472b6" };
    const nodes = ATLAS.JOURNEY.nodes.map((n) => ({ ...n, m: Engine.skillPct(n.id), band: Engine.masteryBand(Engine.skillPct(n.id)) }));
    const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
    el.innerHTML = `<div class="page" style="--ac:var(--purple)">
      <div class="page-head"><h2>${icon("i-route")} Your Mathematical Journey</h2><span class="spacer"></span><span class="pill">${(ATLAS.LENSES.find((l) => l.id === S.settings.lens) || {}).name || "CAPS"} Grade ${S.settings.grade}</span>
        <p class="sub">Mathematics is a connected web, not a ladder. Click any concept to learn or practise it — in any order you like.</p></div>
      <div class="panel">
        <svg class="jmap" viewBox="0 -3 100 68" role="img" aria-label="Concept map of connected skills">
          ${ATLAS.JOURNEY.links.map(([a, b]) => { const A = nodeById[a], B = nodeById[b]; return `<path class="jlink" d="M${A.x} ${A.y} Q ${(A.x + B.x) / 2} ${(A.y + B.y) / 2 - 4} ${B.x} ${B.y}"/>`; }).join("")}
          ${nodes.map((n) => `<g class="jnode" data-node="${n.id}" tabindex="0" role="button" aria-label="${esc(n.label)}: ${n.m}% mastery">
            <circle cx="${n.x}" cy="${n.y}" r="5.6" stroke="${bandCol[n.band]}" style="filter:drop-shadow(0 0 3px ${bandCol[n.band]})"/>
            <circle cx="${n.x}" cy="${n.y}" r="${(5.6 * Math.max(10, n.m)) / 100}" fill="${bandCol[n.band]}" opacity=".35" stroke="none"/>
            <text x="${n.x}" y="${n.y + 9.6}">${esc(n.label)}</text>
            <text class="sub" x="${n.x}" y="${n.y + 13}">${n.m}%</text>
          </g>`).join("")}
        </svg>
        <div class="legend" style="margin-top:8px">
          <span style="--c:#34d399">Secure</span><span style="--c:#4ee1ff">Practising</span><span style="--c:#fbbf24">Ready to Review</span><span style="--c:#f472b6">Need Foundation</span>
        </div>
      </div>
      <div class="panel" style="margin-top:14px" id="jDetail" hidden></div>
    </div>`;
    $$("[data-node]", el).forEach((g) => {
      const open = () => {
        const id = g.dataset.node;
        const sk = ATLAS.SKILLS.find((s) => s.id === id);
        const lesson = ATLAS.LESSONS.find((l) => l.skill === id);
        const d = $("#jDetail", el);
        d.hidden = false;
        d.innerHTML = `<h3>${esc(sk.name)} <span class="pill" style="margin-left:8px">Grade ${sk.grade} • ${sk.strand}</span></h3>
          <div class="meter"><div class="bar"><span style="width:${Engine.skillPct(id)}%"></span></div><b>${Engine.skillPct(id)}%</b></div>
          <div class="kbd-row">${lesson ? `<a class="btn btn-mini" href="#learn/${lesson.id}">📘 Learn it</a>` : ""}<button class="btn btn-mini btn-amber" data-jq="${sk.gen}">🎯 Practise it</button></div>
          <div id="jQuiz" style="margin-top:12px"></div>`;
        d.scrollIntoView({ behavior: "smooth" });
        $("[data-jq]", d).addEventListener("click", () => runQuiz($("#jQuiz", d), { gens: [sk.gen], count: 6, title: sk.name, onClose: () => VIEWS.journey(el) }));
      };
      g.addEventListener("click", open);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  };

  /* ---------- Study ---------- */
  VIEWS.study = (el, param) => {
    const S = Engine.state;
    const cats = Object.keys(ATLAS.FORMULAS);
    const cat = cats.includes(param) ? param : cats[0];
    el.innerHTML = `<div class="page" style="--ac:var(--blue)">
      <div class="page-head"><h2>${icon("i-book")} Study — Formula Vault</h2>
        <p class="sub">Formulas, worked examples and your own notes — everything stays on this device.</p></div>
      <div class="grid grid-side">
        <div class="panel"><h4>Topics</h4><ul class="list">${cats.map((c) => `<li data-cat="${c}" style="cursor:pointer; ${c === cat ? "border-color:var(--blue)" : ""}"><b>${c}</b><span class="spacer"></span><span class="muted">${ATLAS.FORMULAS[c].length}</span></li>`).join("")}</ul>
          <h4 style="margin-top:16px">Bookmarks</h4>
          <ul class="list" id="bmList">${S.bookmarks.length ? S.bookmarks.map((b) => `<li style="font-size:12.5px">⭐ ${esc(b)}</li>`).join("") : '<li class="muted" style="font-size:12px">Star a formula to pin it here.</li>'}</ul>
        </div>
        <div style="display:flex; flex-direction:column; gap:14px">
          ${ATLAS.FORMULAS[cat].map((f) => `<div class="panel">
            <div style="display:flex; align-items:center; gap:10px"><h3 style="margin:0">${esc(f.name)}</h3><span class="spacer"></span>
              <button class="pill pill-btn" data-bm="${esc(f.name)}" aria-pressed="${S.bookmarks.includes(f.name)}">${S.bookmarks.includes(f.name) ? "⭐ Saved" : "☆ Save"}</button></div>
            <p class="formula">${esc(f.f)}</p>
            <p class="muted" style="font-size:13px; margin:0"><b>Example:</b> ${esc(f.ex)}</p></div>`).join("")}
          <div class="panel"><h3>${icon("i-scroll")} My Notes</h3>
            <textarea id="studyNotes" placeholder="Write your own explanations, tricks and reminders here… they save automatically on this device.">${esc(S.notes)}</textarea>
            <p class="muted" style="font-size:11.5px; margin:8px 0 0">🔒 Notes never leave your browser.</p></div>
        </div>
      </div>
    </div>`;
    $$("[data-cat]", el).forEach((b) => b.addEventListener("click", () => VIEWS.study(el, b.dataset.cat)));
    $$("[data-bm]", el).forEach((b) => b.addEventListener("click", () => { const n = b.dataset.bm; const i = S.bookmarks.indexOf(n); i >= 0 ? S.bookmarks.splice(i, 1) : S.bookmarks.push(n); Engine.save(); VIEWS.study(el, cat); }));
    $("#studyNotes", el).addEventListener("input", (e) => { S.notes = e.target.value; Engine.save(); });
  };

  /* ---------- Exam Arena ---------- */
  VIEWS.exam = (el) => {
    const S = Engine.state;
    el.innerHTML = `<div class="page" style="--ac:var(--gold)">
      <div class="page-head"><h2>${icon("i-scroll")} Exam Arena</h2><span class="spacer"></span><span class="pill">${(ATLAS.LENSES.find((l) => l.id === S.settings.lens) || {}).name || "CAPS"} Grade ${S.settings.grade === "AS" || S.settings.grade === "A2" ? S.settings.grade : S.settings.grade}</span>
        <p class="sub">Train like it's the real thing — paper-style sessions, topic drills and full simulations.</p></div>
      <div class="grid grid-3">
        <div class="panel"><h3>${icon("i-scroll")} Past Papers</h3>
          <ul class="list">${ATLAS.PAPERS.map((p) => `<li><b>${p.year}</b> ${p.paper}<span class="spacer"></span><button class="pill pill-btn" data-paper="${p.year}" title="${esc(p.focus)}">Start</button></li>`).join("")}</ul>
          <p class="muted" style="font-size:11.5px; margin:10px 0 0">Paper-style question mixes generated on demand — endless practice, zero downloads.</p></div>
        <div class="panel"><h3>${icon("i-target")} Topic Practice</h3>
          ${ATLAS.EXAM_TOPICS.map((t) => { const pct = topicPct(t); return `<div class="meter"><div><div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px"><b>${t.name}</b><span class="muted">${pct}%</span></div><div class="bar"><span style="width:${pct}%"></span></div></div><button class="pill pill-btn" data-topic="${t.id}">Drill</button></div>`; }).join("")}</div>
        <div class="panel" style="display:flex; flex-direction:column"><h3>${icon("i-timer")} Exam Simulation</h3>
          <p class="muted" style="font-size:13px">A timed, mixed, exam-weighted session. No hints — just you and the paper. Review appears at the end, like a marker's report.</p>
          <ul class="list" style="margin-bottom:12px"><li>⏱️ 10 minutes</li><li>📝 20 mixed questions</li><li>🎯 All four topic areas</li></ul>
          <button class="btn" id="examSim" style="margin-top:auto">Start Full Paper Simulation</button></div>
      </div>
      <div class="panel" style="margin-top:14px" id="examHost" hidden></div>
    </div>`;
    function topicPct(t) { const arr = t.gens.map((g) => { const sk = ATLAS.SKILLS.find((s) => s.gen === g); return sk ? Engine.skillPct(sk.id) : 0; }); return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length); }
    const host = $("#examHost", el);
    const start = (gens, title, opts2) => { host.hidden = false; host.scrollIntoView({ behavior: "smooth" }); runQuiz(host, Object.assign({ gens, count: 12, title, onClose: () => VIEWS.exam(el) }, opts2 || {})); };
    $$("[data-paper]", el).forEach((b) => b.addEventListener("click", () => start(["linear", "quadratic", "funceval", "sequence", "finance", "probability"], `${b.dataset.paper} Paper 1`, { count: 15 })));
    $$("[data-topic]", el).forEach((b) => { const t = ATLAS.EXAM_TOPICS.find((x) => x.id === b.dataset.topic); b.addEventListener("click", () => start(t.gens, t.name + " drill", { count: 10 })); });
    $("#examSim", el).addEventListener("click", () => start(["linear", "quadratic", "funceval", "probability", "derivative", "finance", "sequence", "exponents"], "Full Paper Simulation", { count: 20, seconds: 600 }));
  };

  /* ---------- Arena ---------- */
  VIEWS.arena = (el, param) => {
    const S = Engine.state;
    const modes = [
      { id: "drill", name: "Quick Drill", desc: "20 questions • your pace • hints on", count: 20 },
      { id: "timed", name: "Timed", desc: "90 seconds • as many as you can", seconds: 90 },
      { id: "mixed", name: "Mixed", desc: "12 questions • every strand", count: 12 },
      { id: "boss", name: "Boss Challenge", desc: "10 questions • harder level • no hints", count: 10, boost: 2 },
    ];
    const mode = modes.find((m) => m.id === param) || modes[0];
    const review = Engine.reviewQueue();
    const allGens = ["linear", "fractions", "percent", "sequence", "exponents", "funceval", "geometry", "probability", "stats", "integers"];
    const lb = [...S.leaderboard, { name: "You", xp: S.xp, you: true }].sort((a, b) => b.xp - a.xp).slice(0, 6);
    el.innerHTML = `<div class="page" style="--ac:var(--red)">
      <div class="page-head"><h2>${icon("i-target")} Arena — Challenge Yourself</h2>
        <p class="sub">Practice modes for every mood. The leaderboard is local — the ghosts you race live on this device only.</p></div>
      <div class="tabbar">${modes.map((m) => `<button class="pill pill-btn" data-mode="${m.id}" aria-pressed="${m.id === mode.id}">${m.name}</button>`).join("")}${review.length ? `<button class="pill pill-btn" data-mode="review" style="border-color:var(--gold); color:var(--gold)">⏰ Review Due (${review.length})</button>` : ""}</div>
      <div class="grid grid-3">
        <div class="panel" style="display:flex; flex-direction:column"><h3>${esc(mode.name)}</h3>
          <p class="muted" style="font-size:13.5px">${esc(mode.desc)}</p>
          <p class="muted" style="font-size:12.5px">${mode.id === "boss" ? "⚔️ Beat 80% to slay the boss and earn a badge." : mode.id === "timed" ? "⚡ Speed builds fluency — accuracy still counts." : "🎯 Steady practice moves every Passport dimension."}</p>
          <button class="btn" id="arenaStart" style="margin-top:auto">Start Challenge</button></div>
        <div class="panel" style="text-align:center"><h3>Your Best</h3>
          <div class="ring-stat"><svg viewBox="0 0 84 84"><circle class="rs-track" cx="42" cy="42" r="36"/><circle class="rs-fill" cx="42" cy="42" r="36" stroke-dasharray="226" stroke-dashoffset="${226 - (226 * (S.bests[mode.id] || 0)) / 100}"/></svg><b>${S.bests[mode.id] || 0}%</b></div>
          <p class="muted" style="font-size:12.5px">best ${esc(mode.name.toLowerCase())} score</p></div>
        <div class="panel"><h3>${icon("i-trophy")} Leaderboard <span class="muted" style="font-size:10.5px; font-weight:400">(local ghosts)</span></h3>
          <ul class="list lb">${lb.map((p) => `<li class="${p.you ? "is-you" : ""}"><b>${esc(p.name)}</b><span class="spacer"></span>${p.xp.toLocaleString()} XP</li>`).join("")}</ul></div>
      </div>
      <div class="panel" style="margin-top:14px" id="arenaHost" hidden></div>
    </div>`;
    $$("[data-mode]", el).forEach((b) => b.addEventListener("click", () => { if (b.dataset.mode === "review") { startArena("review"); } else VIEWS.arena(el, b.dataset.mode); }));
    const sessGens = sessionStorage.getItem("arena.gens");
    if (sessGens) { sessionStorage.removeItem("arena.gens"); startArena("drill", [sessGens]); }
    $("#arenaStart", el).addEventListener("click", () => startArena(mode.id));
    function startArena(id, forceGens) {
      const host = $("#arenaHost", el); host.hidden = false; host.scrollIntoView({ behavior: "smooth" });
      let gens = forceGens || allGens;
      const m = modes.find((x) => x.id === id) || mode;
      if (id === "review") gens = review.map((rid) => (ATLAS.SKILLS.find((s) => s.id === rid) || {}).gen).filter(Boolean);
      runQuiz(host, { gens: gens.length ? gens : allGens, count: m.count, seconds: m.seconds, levelBoost: m.boost || 0, title: id === "review" ? "Spaced Review" : m.name,
        onDone: (r) => { if (S.bests[m.id] !== undefined && r.pct > S.bests[m.id]) { S.bests[m.id] = r.pct; toast(`🏆 New ${m.name} best: ${r.pct}%`); } if (m.id === "boss" && r.pct >= 80) { S.totals.bossWins++; } Engine.save(); },
        onClose: () => VIEWS.arena(el, mode.id) });
    }
  };

  /* ---------- Data Desk ---------- */
  VIEWS.data = (el, param) => {
    const ds = ATLAS.DATASETS.find((d) => d.id === param) || ATLAS.DATASETS[2];
    const vals = ds.values;
    const mean = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    const max = Math.max(...vals), min = Math.min(...vals);
    el.innerHTML = `<div class="page" style="--ac:var(--teal)">
      <div class="page-head"><h2>${icon("i-chart")} Data Desk — Investigation Lab</h2>
        <p class="sub">Real data thinking: read the chart, question it, then let Mathaloid stress-test your conclusions.</p></div>
      <div class="grid grid-side">
        <div class="panel"><h4>Datasets</h4><ul class="list">${ATLAS.DATASETS.map((d) => `<li data-ds="${d.id}" style="cursor:pointer; ${d.id === ds.id ? "border-color:var(--teal)" : ""}"><b>${esc(d.name)}</b></li>`).join("")}</ul>
          <div class="panel" style="margin-top:14px; padding:12px"><h4>Quick stats</h4>
          <p style="font-size:13px; margin:4px 0">Mean: <b>${mean}</b></p><p style="font-size:13px; margin:4px 0">Max: <b>${max}</b> • Min: <b>${min}</b></p><p style="font-size:13px; margin:4px 0">Range: <b>${max - min}</b></p></div></div>
        <div style="display:flex; flex-direction:column; gap:14px">
          <div class="panel"><h3>${esc(ds.name)} <span class="muted" style="font-size:11px">(${esc(ds.unit)})</span></h3>
            <div class="chart-box"><canvas id="dsChart" width="720" height="260"></canvas></div></div>
          <div class="grid grid-2">
            <div class="panel"><h3>🔍 Insights</h3><ul class="list">${ds.insights.map((i) => `<li style="font-size:13px">${esc(i)}</li>`).join("")}</ul></div>
            <div class="panel"><h3>🤖 Ask Mathaloid</h3><p class="muted" style="font-size:13px">Quiz yourself on data skills — means, medians and probability — using questions like the ones markers love.</p>
              <button class="btn btn-mini" id="dsQuiz">Data challenge</button><div id="dsQuizHost" style="margin-top:12px"></div></div>
          </div>
        </div>
      </div>
    </div>`;
    // bar chart
    const cv = $("#dsChart", el), ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, pad = 34;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(145,165,255,.25)"; ctx.beginPath(); ctx.moveTo(pad, 10); ctx.lineTo(pad, H - pad); ctx.lineTo(W - 10, H - pad); ctx.stroke();
    const bw = (W - pad - 20) / vals.length;
    vals.forEach((v, i) => {
      const h = ((H - pad - 20) * v) / max;
      const x = pad + 8 + i * bw, y = H - pad - h;
      const g = ctx.createLinearGradient(0, y, 0, H - pad);
      g.addColorStop(0, "#2dd4bf"); g.addColorStop(1, "rgba(45,212,191,.15)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(x, y, bw - 16, h, 6); ctx.fill();
      ctx.fillStyle = "#96a2c8"; ctx.font = "11px system-ui"; ctx.textAlign = "center";
      ctx.fillText(ds.labels[i], x + (bw - 16) / 2, H - pad + 16);
      ctx.fillStyle = "#e9efff"; ctx.fillText(v, x + (bw - 16) / 2, y - 6);
    });
    $$("[data-ds]", el).forEach((b) => b.addEventListener("click", () => VIEWS.data(el, b.dataset.ds)));
    $("#dsQuiz", el).addEventListener("click", () => runQuiz($("#dsQuizHost", el), { gens: ["stats", "probability", "percent"], count: 6, title: "Data challenge", onClose: () => VIEWS.data(el, ds.id) }));
  };

  /* ---------- Frontier ---------- */
  VIEWS.frontier = (el) => {
    el.innerHTML = `<div class="page" style="--ac:var(--pink)">
      <div class="page-head"><h2>${icon("i-spark")} Frontier — Explore. Prove. Create.</h2>
        <p class="sub">Beyond any syllabus: conjectures, proofs, models and computation. This is where mathematicians live.</p></div>
      <div class="grid grid-2">${ATLAS.FRONTIER.map((f) => `<div class="panel" style="--oc:var(--${f.color})">
        <h3><span class="orb-bubble" style="width:44px; height:44px; animation:none; font-size:18px">${icon(f.icon)}</span> ${esc(f.name)}</h3>
        <p class="muted" style="font-size:13.5px">${esc(f.desc)}</p>
        <ul class="list">${f.tasks.map((t) => `<li style="font-size:13px">🧭 ${esc(t)}</li>`).join("")}</ul>
        ${f.id === "code" ? `<div style="margin-top:12px"><div class="kbd-row"><input type="text" id="calcIn" placeholder="Try: (1+2+3)*4^2 or 100*(1.05)**10" style="flex:1"><button class="btn btn-mini" id="calcRun">Run</button></div>
          <pre id="calcOut" style="margin-top:10px; min-height:64px">› Your local maths notebook — expressions run in your browser, nothing is sent anywhere.</pre>
          <div class="kbd-row"><button class="pill pill-btn" data-demo="sum">Σ 1..100</button><button class="pill pill-btn" data-demo="fib">Fibonacci</button><button class="pill pill-btn" data-demo="dice">🎲 100 dice</button><button class="pill pill-btn" data-demo="primes">Primes < 100</button></div></div>` : ""}
      </div>`).join("")}</div>
    </div>`;
    const out = $("#calcOut", el);
    const print = (s) => { out.textContent = "› " + s; };
    $("#calcRun", el).addEventListener("click", () => { const v = safeCalc($("#calcIn", el).value); print(v === null ? "Hmm — I can only run pure arithmetic here (numbers, + − × ÷ ^ and brackets)." : $("#calcIn", el).value + " = " + v); });
    $("#calcIn", el).addEventListener("keydown", (e) => { if (e.key === "Enter") $("#calcRun", el).click(); });
    $$("[data-demo]", el).forEach((b) => b.addEventListener("click", () => {
      const d = b.dataset.demo;
      if (d === "sum") { let s = 0; for (let i = 1; i <= 100; i++) s += i; print(`1 + 2 + … + 100 = ${s}\nGauss's shortcut: n(n+1)/2 = 100×101/2 = ${(100 * 101) / 2} ✓`); }
      if (d === "fib") { const f = [1, 1]; while (f.length < 12) f.push(f.at(-1) + f.at(-2)); print(`Fibonacci: ${f.join(", ")}\nNeighbour ratios → ${(f.at(-1) / f.at(-2)).toFixed(6)} ≈ φ (the golden ratio!)`); }
      if (d === "dice") { const c = [0, 0, 0, 0, 0, 0]; for (let i = 0; i < 100; i++) c[Math.floor(Math.random() * 6)]++; print(`100 dice rolls → faces 1–6: ${c.join(", ")}\nTheory says ~16.7 each. Randomness is lumpy — that's the point!`); }
      if (d === "primes") { const ps = []; for (let n = 2; n < 100; n++) { let p = true; for (let k = 2; k * k <= n; k++) if (n % k === 0) { p = false; break; } if (p) ps.push(n); } print(`Primes below 100 (${ps.length} of them):\n${ps.join(", ")}`); }
    }));
  };

  /* ---------- Settings ---------- */
  VIEWS.settings = (el) => {
    const S = Engine.state;
    const themes = [["focus", "Focus"], ["cosmic", "Cosmic"], ["neon", "Neon"], ["contrast", "High Contrast"]];
    el.innerHTML = `<div class="page" style="--ac:var(--slate)">
      <div class="page-head"><h2>${icon("i-gear")} Settings</h2>
        <p class="sub">Make the Atlas yours. Every setting lives on this device — nothing syncs anywhere.</p></div>
      <div class="grid grid-2">
        <div class="panel"><h3>🎨 Appearance</h3>
          <div class="swatches">${themes.map(([id, name]) => `<button class="swatch" data-theme="${id}" aria-pressed="${S.settings.theme === id}"><span class="sw sw-${id}"></span>${name}</button>`).join("")}</div>
          <div class="opt-row" style="margin-top:10px"><label>Text size<span class="hint">Small • Normal • Large</span></label>
            <input type="range" min="0" max="2" step="1" id="setText" value="${["small", "normal", "large"].indexOf(S.settings.textSize)}" style="width:160px"></div>
          <div class="opt-row"><label>Compact density<span class="hint">Tighter panels, more on screen</span></label><input type="checkbox" class="switch" id="setDense" ${S.settings.density === "dense" ? "checked" : ""}></div>
        </div>
        <div class="panel"><h3>♿ Accessibility & Audio</h3>
          <div class="opt-row"><label>Reduce motion<span class="hint">Calms floating orbs & animations</span></label><input type="checkbox" class="switch" id="setMotion" ${S.settings.reducedMotion ? "checked" : ""}></div>
          <div class="opt-row"><label>Sound effects<span class="hint">Generated locally — nothing downloads</span></label><input type="checkbox" class="switch" id="setSound" ${S.settings.sound ? "checked" : ""}></div>
          <div class="opt-row"><label>Speak answers aloud<span class="hint">Uses your device's built-in voice</span></label><input type="checkbox" class="switch" id="setSpeak" ${S.settings.speak ? "checked" : ""}></div>
          <div class="opt-row"><label>Curriculum lens</label><select id="setLens">${ATLAS.LENSES.map((l) => `<option value="${l.id}" ${S.settings.lens === l.id ? "selected" : ""}>${l.name}</option>`).join("")}</select></div>
          <div class="opt-row"><label>Grade / level</label><select id="setGrade">${ATLAS.GRADES.map((g) => `<option value="${g}" ${g === S.settings.grade ? "selected" : ""}>${g === "AS" || g === "A2" ? "A Level " + g : "Grade " + g}</option>`).join("")}</select></div>
        </div>
        <div class="panel" id="dataPanel"><h3>🔐 Your Data</h3>
          <p class="muted" style="font-size:13px">Everything — progress, notes, settings — is stored in your browser's local storage on this device. There are no accounts, no servers, no analytics, no cookies. Export a backup to move to another device.</p>
          <div class="kbd-row"><button class="btn btn-mini" id="expData">${icon("i-download")} Export backup</button>
            <label class="btn btn-mini btn-ghost" style="cursor:pointer">${icon("i-upload")} Import <input type="file" accept=".json" id="impData" hidden></label>
            <button class="btn btn-mini btn-ghost" id="rstData" style="color:var(--red)">${icon("i-trash")} Erase everything</button></div></div>
        <div class="panel"><h3>📖 About</h3>
          <p class="muted" style="font-size:13px">MATHALOID Atlas is open source under the <b>MIT License</b>. Fork it, remix it, translate it — mathematics belongs to everyone. Runs entirely as static files (perfect for GitHub Pages) and works offline once loaded.</p>
          <p class="muted" style="font-size:12px">Local-First • Privacy First • Open Source • Offline Ready</p></div>
      </div>
    </div>`;
    $$("[data-theme]", el).forEach((b) => b.addEventListener("click", () => { S.settings.theme = b.dataset.theme; Engine.save(); applySettings(); VIEWS.settings(el); }));
    $("#setText", el).addEventListener("input", (e) => { S.settings.textSize = ["small", "normal", "large"][Number(e.target.value)]; Engine.save(); applySettings(); });
    $("#setDense", el).addEventListener("change", (e) => { S.settings.density = e.target.checked ? "dense" : "cozy"; Engine.save(); applySettings(); });
    $("#setMotion", el).addEventListener("change", (e) => { S.settings.reducedMotion = e.target.checked; Engine.save(); applySettings(); });
    $("#setSound", el).addEventListener("change", (e) => { S.settings.sound = e.target.checked; Engine.save(); if (e.target.checked) sfx.click(); });
    $("#setSpeak", el).addEventListener("change", (e) => { S.settings.speak = e.target.checked; Engine.save(); });
    $("#setLens", el).addEventListener("change", (e) => { S.settings.lens = e.target.value; Engine.save(); refreshHud(); });
    $("#setGrade", el).addEventListener("change", (e) => { S.settings.grade = e.target.value; Engine.save(); refreshHud(); });
    $("#expData", el).addEventListener("click", () => {
      const blob = new Blob([Engine.exportJSON()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mathaloid-atlas-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(a.href);
      toast("📦 Backup exported — keep it safe!");
    });
    $("#impData", el).addEventListener("change", (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { Engine.importJSON(r.result); toast("✅ Backup restored!"); applySettings(); refreshHud(); VIEWS.settings(el); } catch (err) { toast("⚠️ That file isn't a valid Atlas backup."); } };
      r.readAsText(f);
    });
    $("#rstData", el).addEventListener("click", () => { if (confirm("Erase ALL local progress, notes and settings? This cannot be undone.")) { Engine.reset(); applySettings(); refreshHud(); VIEWS.settings(el); toast("🧹 Fresh start — everything erased."); } });
  };

  /* ---------- Passport ---------- */
  VIEWS.passport = (el) => {
    const S = Engine.state;
    const skills = Object.entries(S.skills).map(([id, k]) => ({ id, ...k, name: (ATLAS.SKILLS.find((s) => s.id === id) || { name: id }).name })).sort((a, b) => b.mastery - a.mastery);
    const top = skills.slice(0, 6);
    const recent = skills.slice().sort((a, b) => b.last - a.last).slice(0, 6);
    el.innerHTML = `<div class="page" style="--ac:var(--gold)">
      <div class="page-head"><h2>${icon("i-star")} Mathematical Passport</h2><span class="spacer"></span><span class="pill">Overall mastery: ${Engine.overallMastery()}%</span>
        <p class="sub">Marks measure one moment. Your Passport measures the mathematician you're becoming — across five dimensions.</p></div>
      <div class="grid grid-3">
        <div class="panel" style="text-align:center"><h3>Overall Mastery</h3>
          <canvas id="ppRadar" width="240" height="210"></canvas>
          <ul class="radar-legend" style="flex-direction:row; flex-wrap:wrap; justify-content:center; gap:8px; margin-top:6px">
            <li style="--c:#4ee1ff">Understand</li><li style="--c:#34d399">Fluent</li><li style="--c:#fbbf24">Apply</li><li style="--c:#a78bfa">Reason</li><li style="--c:#f472b6">Create</li></ul></div>
        <div class="panel"><h3>Top Skills</h3>
          ${top.length ? top.map((s) => `<div class="meter"><div><div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px"><b>${esc(s.name)}</b><span class="muted">${s.mastery}%</span></div><div class="bar"><span style="width:${s.mastery}%"></span></div></div></div>`).join("") : '<p class="muted" style="font-size:13px">Answer a few questions and your strongest skills will appear here.</p>'}
          <h4 style="margin-top:14px">Recent activity</h4>
          <ul class="list">${recent.length ? recent.map((s) => `<li style="font-size:12.5px"><b>${esc(s.name)}</b><span class="spacer"></span><span class="muted">${s.correct}/${s.attempts} correct</span></li>`).join("") : '<li class="muted" style="font-size:12px">No activity yet — the Atlas awaits!</li>'}</ul></div>
        <div class="panel"><h3>${icon("i-trophy")} Badges</h3>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:9px">${ATLAS.BADGES.map((b) => { const got = S.badges.includes(b.id); return `<div class="panel" style="padding:10px; text-align:center; ${got ? "border-color:var(--gold)" : "opacity:.45"}" title="${esc(b.desc)}"><div style="font-size:24px">${b.icon}</div><b style="font-size:12px">${esc(b.name)}</b><div class="muted" style="font-size:10.5px">${esc(b.desc)}</div></div>`; }).join("")}</div>
          <div class="kbd-row" style="margin-top:12px"><span class="pill">🔥 ${S.streak.count}-day streak</span><span class="pill">⚡ ${S.xp.toLocaleString()} XP</span><span class="pill">✓ ${S.totals.correct} solved</span></div></div>
      </div>
    </div>`;
    drawRadar($("#ppRadar", el), S.passport, 240);
  };

  /* ---------- Voice ---------- */
  VIEWS.voice = (el) => {
    el.innerHTML = `<div class="page" style="--ac:var(--cyan)">
      <div class="page-head"><h2>${icon("i-mic")} Voice Mode</h2>
        <p class="sub">Talk to Mathaloid hands-free. Speech stays on your device — recognition uses your browser's built-in engine.</p></div>
      <div class="panel voice-stage">
        <div class="wave" style="justify-content:center; margin:0 auto 20px; height:34px"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <p class="voice-q" id="voiceQ">“What is the area of a circle?”</p>
        <p class="voice-a" id="voiceA">The area of a circle is A = πr², where r is the radius. Try asking me anything — or say “quiz me”!</p>
        <div style="margin-top:26px"><button class="big-mic" id="voiceMic" aria-label="Tap to speak">${icon("i-mic")}</button></div>
        <p class="muted" style="margin-top:12px; font-size:13px" id="voiceHint">Tap to speak</p>
      </div>
    </div>`;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) $("#voiceHint", el).textContent = "🎙️ Voice input isn't available in this browser — the chat on Home does everything Voice Mode does.";
    hookMic($("#voiceMic", el), (text) => {
      $("#voiceQ", el).textContent = "“" + text + "”";
      const reply = BOT.answer(text).replace(/<[^>]+>/g, "");
      $("#voiceA", el).textContent = reply;
      if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(reply.replace(/\n/g, ". ")); speechSynthesis.cancel(); speechSynthesis.speak(u); }
    });
  };

  /* ---------- Help ---------- */
  VIEWS.help = (el) => {
    el.innerHTML = `<div class="page" style="--ac:var(--blue)">
      <div class="page-head"><h2>${icon("i-help")} Help & Privacy</h2></div>
      <div class="grid grid-2">
        <div class="panel"><h3>🧭 Finding your way</h3><ul class="list">
          <li><b>Pathfinder</b> — your recommended route, by grade & curriculum</li>
          <li><b>Learn</b> — step-by-step lessons with visual models</li>
          <li><b>Play</b> — six games that train real skills</li>
          <li><b>Journey</b> — the concept map of everything you know</li>
          <li><b>Study</b> — formula vault, examples & your notes</li>
          <li><b>Exam Arena</b> — paper-style drills & timed simulations</li>
          <li><b>Arena</b> — challenges, bests & a local leaderboard</li>
          <li><b>Data Desk</b> — read and question real datasets</li>
          <li><b>Frontier</b> — conjectures, proofs, models & code</li>
          <li><b>Passport</b> — your five-dimension mathematical identity</li></ul></div>
        <div class="panel"><h3>🔐 Privacy, in plain words</h3>
          <p style="font-size:14px; line-height:1.6">MATHALOID Atlas makes exactly <b>zero network requests</b> after the page loads. No accounts. No analytics. No cookies. No fonts or sounds fetched from third parties. Your progress lives in your browser's local storage and goes with you only when <i>you</i> export it.</p>
          <p class="muted" style="font-size:13px">Open source under the MIT License — anyone may verify every line of this promise.</p>
          <h4 style="margin-top:10px">Tips</h4>
          <ul class="list"><li style="font-size:13px">💡 Stuck? Every question has a hint ladder — hints teach, they don't spoil.</li><li style="font-size:13px">⏰ The Review Due widget uses spaced repetition — little and often beats cramming.</li><li style="font-size:13px">🎙️ Try Voice Mode, or the mic button in the Home chat.</li></ul></div>
      </div>
    </div>`;
  };

  /* ================= ROUTER & INIT ================= */
  function applySettings() {
    const s = Engine.state.settings;
    document.body.dataset.theme = s.theme;
    document.body.classList.toggle("small-text", s.textSize === "small");
    document.body.classList.toggle("large-text", s.textSize === "large");
    document.body.classList.toggle("dense", s.density === "dense");
    document.body.classList.toggle("reduced-motion", s.reducedMotion);
  }

  function route() {
    const hash = (location.hash || "#home").slice(1);
    const [name, param] = hash.split("/");
    const target = $("#view-" + name) ? name : "home";
    $$(".view").forEach((v) => v.classList.remove("is-active"));
    const el = $("#view-" + target);
    el.classList.add("is-active");
    if (VIEWS[target]) VIEWS[target](el, param);
    $$(".dock-btn").forEach((d) => d.classList.toggle("is-active", d.dataset.view === target));
    if (target === "home") refreshHud();
    window.scrollTo({ top: 0 });
  }

  function init() {
    Engine.touchStreak();
    applySettings();
    startStars();
    initChat();
    initFocus();
    refreshHud();
    addEventListener("hashchange", route);
    route();
    $$("[data-go]").forEach((b) => b.addEventListener("click", () => { location.hash = "#" + b.dataset.go; }));
    $("#avatarBtn").addEventListener("click", () => (location.hash = "#passport"));
    const more = $("#dockMore"), sheet = $("#moreSheet");
    more.addEventListener("click", () => (sheet.hidden = !sheet.hidden));
    sheet.addEventListener("click", () => (sheet.hidden = true));
    console.log("%cMATHALOID ATLAS%c local-first • privacy-first • MIT", "color:#a78bfa; font-weight:bold", "color:#4ee1ff");
  }

  document.readyState === "loading" ? addEventListener("DOMContentLoaded", init) : init();

  return { toast };
})();
