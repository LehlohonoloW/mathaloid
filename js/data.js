/* MATHALOID ATLAS — data layer. MIT License. All data ships with the app; nothing is fetched. */
"use strict";
const ATLAS = {};

ATLAS.LENSES = [
  { id: "caps", name: "CAPS", note: "South African national curriculum (Gr 1–12)" },
  { id: "ieb", name: "IEB", note: "CAPS-based NSC with extended depth" },
  { id: "cambridge", name: "A Levels", note: "Cambridge 9709 / 9231 international" },
  { id: "open", name: "Open Maths", note: "No ceiling — explore beyond any syllabus" },
];

ATLAS.GRADES = ["R","1","2","3","4","5","6","7","8","9","10","11","12","AS","A2"];

/* Skills: the Atlas knowledge graph. gen = generator key, lvl = 1..10 difficulty anchor */
ATLAS.SKILLS = [
  { id:"counting",      name:"Counting & Number Names",   grade:"1",  strand:"Number",    gen:"counting",   lvl:1, prereqs:[] },
  { id:"add-sub-20",    name:"Add & Subtract to 20",      grade:"1",  strand:"Number",    gen:"addsub20",   lvl:1, prereqs:["counting"] },
  { id:"place-value",   name:"Place Value",               grade:"3",  strand:"Number",    gen:"placevalue", lvl:2, prereqs:["add-sub-20"] },
  { id:"times-tables",  name:"Times Tables",              grade:"4",  strand:"Number",    gen:"times",      lvl:2, prereqs:["add-sub-20"] },
  { id:"long-division", name:"Division Strategies",       grade:"5",  strand:"Number",    gen:"division",   lvl:3, prereqs:["times-tables"] },
  { id:"fractions",     name:"Fractions",                 grade:"6",  strand:"Number",    gen:"fractions",  lvl:3, prereqs:["place-value"] },
  { id:"percentages",   name:"Percentages & Ratio",       grade:"7",  strand:"Number",    gen:"percent",    lvl:4, prereqs:["fractions"] },
  { id:"integers",      name:"Integers & Rational Numbers",grade:"8", strand:"Number",    gen:"integers",   lvl:4, prereqs:["percentages"] },
  { id:"exponents",     name:"Exponents",                 grade:"8",  strand:"Algebra",   gen:"exponents",  lvl:5, prereqs:["integers"] },
  { id:"expressions",   name:"Algebraic Expressions",     grade:"8",  strand:"Algebra",   gen:"expressions",lvl:5, prereqs:["integers"] },
  { id:"linear-eq",     name:"Linear Equations",          grade:"8",  strand:"Algebra",   gen:"linear",     lvl:5, prereqs:["expressions"] },
  { id:"inequalities",  name:"Inequalities",              grade:"9",  strand:"Algebra",   gen:"inequality", lvl:6, prereqs:["linear-eq"] },
  { id:"patterns",      name:"Patterns & Sequences",      grade:"9",  strand:"Algebra",   gen:"sequence",   lvl:5, prereqs:["expressions"] },
  { id:"functions",     name:"Functions & Graphs",        grade:"10", strand:"Functions", gen:"funceval",   lvl:6, prereqs:["linear-eq","patterns"] },
  { id:"systems",       name:"Systems of Equations",      grade:"10", strand:"Algebra",   gen:"systems",    lvl:7, prereqs:["linear-eq"] },
  { id:"quadratics",    name:"Quadratic Equations",       grade:"10", strand:"Algebra",   gen:"quadratic",  lvl:7, prereqs:["expressions","exponents"] },
  { id:"trig",          name:"Trigonometry",              grade:"10", strand:"Geometry",  gen:"trig",       lvl:7, prereqs:["functions"] },
  { id:"geometry-area", name:"Area, Perimeter & Volume",  grade:"7",  strand:"Geometry",  gen:"geometry",   lvl:4, prereqs:["times-tables"] },
  { id:"probability",   name:"Probability",               grade:"11", strand:"Statistics",gen:"probability",lvl:7, prereqs:["fractions"] },
  { id:"statistics",    name:"Data & Statistics",         grade:"9",  strand:"Statistics",gen:"stats",      lvl:5, prereqs:["percentages"] },
  { id:"finance",       name:"Financial Maths",           grade:"11", strand:"Number",    gen:"finance",    lvl:8, prereqs:["percentages","exponents"] },
  { id:"derivatives",   name:"Differentiation",           grade:"12", strand:"Calculus",  gen:"derivative", lvl:9, prereqs:["quadratics","functions"] },
  { id:"integrals",     name:"Integration",               grade:"AS", strand:"Calculus",  gen:"integral",   lvl:10, prereqs:["derivatives"] },
  { id:"complex",       name:"Complex Numbers",           grade:"A2", strand:"Pure",      gen:"complex",    lvl:10, prereqs:["quadratics"] },
];

/* Journey map layout (mirrors reference image 4th panel). Coordinates on a 100x62 grid. */
ATLAS.JOURNEY = {
  nodes: [
    { id:"integers",     label:"Rational Numbers",     x:14, y:14 },
    { id:"exponents",    label:"Exponents",            x:14, y:44 },
    { id:"expressions",  label:"Algebraic Expressions",x:34, y:26 },
    { id:"linear-eq",    label:"Linear Equations",     x:52, y:14 },
    { id:"inequalities", label:"Inequalities",         x:52, y:42 },
    { id:"patterns",     label:"Sequences",            x:34, y:52 },
    { id:"functions",    label:"Functions",            x:70, y:26 },
    { id:"systems",      label:"Systems of Equations", x:70, y:50 },
    { id:"quadratics",   label:"Quadratic Equations",  x:88, y:38 },
  ],
  links: [ ["integers","expressions"],["exponents","expressions"],["expressions","linear-eq"],["expressions","patterns"],["linear-eq","inequalities"],["linear-eq","functions"],["linear-eq","systems"],["functions","quadratics"],["systems","quadratics"],["patterns","functions"] ],
};

ATLAS.GAMES = [
  { id:"number-lab",        name:"Number Lab",        color:"cyan",   icon:"i-atom",   desc:"Build number sense: operations, negatives, place value.", gens:["addsub20","times","division","integers","placevalue"] },
  { id:"fraction-forge",    name:"Fraction Forge",    color:"orange", icon:"i-pi",     desc:"Forge fractions, decimals, percentages and ratio.", gens:["fractions","percent"] },
  { id:"pattern-detective", name:"Pattern Detective", color:"purple", icon:"i-spark",  desc:"Crack sequences and find the rule like a detective.", gens:["sequence","exponents"] },
  { id:"strategy-quest",    name:"Strategy Quest",    color:"green",  icon:"i-compass",desc:"Multi-step word problems. Plan, solve, check.", gens:["linear","systems","finance"] },
  { id:"function-flight",   name:"Function Flight",   color:"blue",   icon:"i-fx",     desc:"Pilot graphs: evaluate, transform and read functions.", gens:["funceval","quadratic","derivative"] },
  { id:"geometry-studio",   name:"Geometry Studio",   color:"pink",   icon:"i-shapes", desc:"Space and shape: area, volume, angles and trig.", gens:["geometry","trig"] },
];

ATLAS.LESSONS = [
  {
    id:"linear-eq", skill:"linear-eq", title:"Solving Linear Equations", grade:"Grade 8 • CAPS",
    steps:["Introduction","The Idea","Examples","Your Turn","Try It","Challenge"],
    balance:{ left:"3x + 7", right:"22", solution:5 },
    content:[
      { t:"Introduction", body:"An equation is a statement that two things are <b>equal</b> — like a perfectly balanced scale. Solving it means finding the value of the unknown (usually <b>x</b>) that keeps the scale balanced." },
      { t:"The Idea", body:"Whatever you do to one side, you must do to the other. Subtract 7 from <b>both</b> pans and the scale stays level: 3x + 7 = 22 becomes 3x = 15. Divide both pans by 3: x = 5." },
      { t:"Examples", body:"① x + 4 = 9 → x = 5. ② 2x = 14 → x = 7. ③ 3x + 7 = 22 → 3x = 15 → x = 5. ④ 5x − 3 = 2x + 9 → 3x = 12 → x = 4." },
      { t:"Your Turn", body:"Undo operations in reverse order: undo + and − first, then × and ÷. Check your answer by substituting it back into the original equation." },
      { t:"Try It", practice:"linear" },
      { t:"Challenge", practice:"systems" },
    ],
  },
  {
    id:"fractions", skill:"fractions", title:"Making Sense of Fractions", grade:"Grade 6 • CAPS",
    steps:["Introduction","The Idea","Examples","Your Turn","Try It","Challenge"],
    content:[
      { t:"Introduction", body:"A fraction describes <b>equal parts of a whole</b>. In ¾ the bottom number (denominator) says how many equal parts; the top (numerator) says how many you have." },
      { t:"The Idea", body:"Equivalent fractions are the same amount in different clothes: ½ = 2/4 = 3/6. Multiply or divide top and bottom by the same number and the value never changes." },
      { t:"Examples", body:"① ½ + ¼ = 2/4 + 1/4 = ¾. ② 2/3 of 12 = 8. ③ 5/10 simplifies to ½." },
      { t:"Your Turn", body:"To compare fractions, give them the same denominator first. To add or subtract, denominators must match." },
      { t:"Try It", practice:"fractions" },
      { t:"Challenge", practice:"percent" },
    ],
  },
  {
    id:"quadratics", skill:"quadratics", title:"Quadratic Equations", grade:"Grade 10–11 • CAPS / IEB",
    steps:["Introduction","The Idea","Examples","Your Turn","Try It","Challenge"],
    content:[
      { t:"Introduction", body:"A quadratic equation has an x² term: ax² + bx + c = 0. Its graph is a parabola and it can have 0, 1 or 2 real solutions." },
      { t:"The Idea", body:"Three tools: <b>factorise</b> (x²−5x+6 = (x−2)(x−3)), <b>complete the square</b>, or use the <b>quadratic formula</b> x = (−b ± √(b²−4ac)) / 2a." },
      { t:"Examples", body:"x² − 5x + 6 = 0 → (x−2)(x−3) = 0 → x = 2 or x = 3. The discriminant b²−4ac tells you how many real roots exist." },
      { t:"Your Turn", body:"Always move everything to one side first so the equation equals zero. Then decide: does it factorise nicely? If not, use the formula." },
      { t:"Try It", practice:"quadratic" },
      { t:"Challenge", practice:"derivative" },
    ],
  },
  {
    id:"derivatives", skill:"derivatives", title:"Introduction to Differentiation", grade:"Grade 12 • CAPS / A Level",
    steps:["Introduction","The Idea","Examples","Your Turn","Try It","Challenge"],
    content:[
      { t:"Introduction", body:"The derivative measures <b>instantaneous rate of change</b> — the gradient of a curve at a single point." },
      { t:"The Idea", body:"Power rule: if f(x) = axⁿ then f′(x) = n·axⁿ⁻¹. Differentiate term by term. Constants vanish." },
      { t:"Examples", body:"f(x) = x³ → f′(x) = 3x².  f(x) = 4x² − 3x + 7 → f′(x) = 8x − 3." },
      { t:"Your Turn", body:"At a turning point f′(x) = 0. Use this to find maxima and minima — the heart of Paper 1 calculus questions." },
      { t:"Try It", practice:"derivative" },
      { t:"Challenge", practice:"integral" },
    ],
  },
];

ATLAS.FORMULAS = {
  Algebra: [
    { name:"Quadratic Formula", f:"x = (−b ± √(b² − 4ac)) / 2a", ex:"x² − 5x + 6 = 0 → a=1, b=−5, c=6 → x = 2 or 3" },
    { name:"Difference of Squares", f:"a² − b² = (a − b)(a + b)", ex:"x² − 9 = (x − 3)(x + 3)" },
    { name:"Exponent Laws", f:"aᵐ × aⁿ = aᵐ⁺ⁿ (aᵐ)ⁿ = aᵐⁿ", ex:"2³ × 2² = 2⁵ = 32" },
    { name:"Arithmetic Sequence", f:"Tₙ = a + (n − 1)d", ex:"3, 7, 11… → T₁₀ = 3 + 9×4 = 39" },
    { name:"Geometric Sequence", f:"Tₙ = arⁿ⁻¹", ex:"2, 6, 18… → T₅ = 2×3⁴ = 162" },
  ],
  Geometry: [
    { name:"Area of Circle", f:"A = πr²", ex:"r = 5 → A = 25π ≈ 78.5" },
    { name:"Pythagoras", f:"a² + b² = c²", ex:"3² + 4² = 5²" },
    { name:"Volume of Cylinder", f:"V = πr²h", ex:"r=2, h=10 → V = 40π" },
    { name:"Sum of Interior Angles", f:"(n − 2) × 180°", ex:"Pentagon: 3×180° = 540°" },
  ],
  Trigonometry: [
    { name:"SOH CAH TOA", f:"sinθ = o/h cosθ = a/h tanθ = o/a", ex:"θ=30°, h=10 → o = 10 sin30° = 5" },
    { name:"Sine Rule", f:"a/sinA = b/sinB = c/sinC", ex:"Solve any triangle with 2 angles + 1 side" },
    { name:"Cosine Rule", f:"a² = b² + c² − 2bc·cosA", ex:"Use when you know 2 sides + included angle" },
    { name:"Identity", f:"sin²θ + cos²θ = 1", ex:"sinθ=0.6 → cosθ=±0.8" },
  ],
  Statistics: [
    { name:"Mean", f:"x̄ = Σx / n", ex:"4, 7, 10 → x̄ = 7" },
    { name:"Probability", f:"P(E) = favourable / total", ex:"P(rolling a 6) = 1/6" },
    { name:"Standard Deviation", f:"σ = √(Σ(x − x̄)² / n)", ex:"Spread of marks around the mean" },
  ],
  Calculus: [
    { name:"Power Rule", f:"d/dx (xⁿ) = n·xⁿ⁻¹", ex:"d/dx (x³) = 3x²" },
    { name:"First Principles", f:"f′(x) = limₕ→₀ (f(x+h) − f(x))/h", ex:"Definition of the derivative" },
    { name:"Integration (Power)", f:"∫xⁿ dx = xⁿ⁺¹/(n+1) + C", ex:"∫x² dx = x³/3 + C" },
  ],
};

ATLAS.PAPERS = [
  { year:2024, paper:"Paper 1", focus:"Algebra • Functions • Sequences • Finance", mins:180 },
  { year:2023, paper:"Paper 1", focus:"Algebra • Functions • Probability", mins:180 },
  { year:2022, paper:"Paper 1", focus:"Equations • Sequences • Calculus", mins:180 },
  { year:2021, paper:"Paper 1", focus:"Algebra • Finance • Functions", mins:180 },
];
ATLAS.EXAM_TOPICS = [
  { id:"algebra",    name:"Algebra",     gens:["linear","quadratic","exponents"] },
  { id:"functions",  name:"Functions",   gens:["funceval","quadratic"] },
  { id:"probability",name:"Probability", gens:["probability","stats"] },
  { id:"calculus",   name:"Calculus",    gens:["derivative","integral"] },
];

ATLAS.DATASETS = [
  { id:"sales", name:"Sales Data", unit:"units", labels:["Mon","Tue","Wed","Thu","Fri","Sat"], values:[34,41,38,52,61,73],
    insights:["Sales grow steadily through the week — Saturday is 2.1× Monday.","Mean daily sales: 49.8 units.","A weekend promotion could exploit the Friday–Saturday climb."] },
  { id:"survey", name:"Survey Results", unit:"votes", labels:["Football","Netball","Athletics","Chess","eSports"], values:[42,35,28,15,31],
    insights:["Football leads with 28% of all votes.","Chess is the smallest group — but 15 learners still chose it.","eSports beats athletics: interests are shifting."] },
  { id:"exam", name:"Exam Scores", unit:"learners", labels:["0–39","40–49","50–59","60–69","70–79","80–100"], values:[4,7,12,18,13,6],
    insights:["The distribution peaks in the 60–69 band — the modal class.","60 learners wrote; the median lies in the 60–69 band.","Only 10% reached 80+: the tail is thin at the top."] },
  { id:"weather", name:"Weather Stats", unit:"°C", labels:["Jan","Mar","May","Jul","Sep","Nov"], values:[26,24,18,12,17,23],
    insights:["Temperatures follow a smooth seasonal curve — a periodic pattern.","Range: 14°C between summer peak and winter low.","July is the coldest month in this southern-hemisphere data."] },
];

ATLAS.BADGES = [
  { id:"first-steps", name:"First Steps", icon:"🌱", test:(s)=>s.totals.attempts>=1, desc:"Answer your first question" },
  { id:"ten-streak", name:"On Fire", icon:"🔥", test:(s)=>s.totals.bestRun>=10, desc:"10 correct in a row" },
  { id:"centurion", name:"Centurion", icon:"💯", test:(s)=>s.totals.correct>=100, desc:"100 correct answers" },
  { id:"explorer", name:"Atlas Explorer", icon:"🧭", test:(s)=>Object.keys(s.skills).length>=6, desc:"Practise 6 different skills" },
  { id:"scholar", name:"Scholar", icon:"🎓", test:(s)=>Object.values(s.skills).some(k=>k.mastery>=90), desc:"Reach 90% mastery in a skill" },
  { id:"focused", name:"Deep Focus", icon:"⏱️", test:(s)=>s.totals.focusSessions>=1, desc:"Complete a focus session" },
  { id:"night-owl", name:"Boss Slayer", icon:"⚔️", test:(s)=>s.totals.bossWins>=1, desc:"Beat a Boss Challenge" },
  { id:"polyglot", name:"No Ceilings", icon:"🚀", test:(s)=>Object.values(s.skills).filter(k=>k.mastery>=60).length>=10, desc:"60%+ mastery in 10 skills" },
];

ATLAS.FRONTIER = [
  { id:"conjecture", name:"Conjecture Lab", icon:"i-flask", color:"cyan",
    desc:"Test bold claims against evidence. Is every even number > 2 the sum of two primes?",
    tasks:["Try 10 even numbers — does Goldbach's conjecture hold?","Is the sum of two odd numbers always even? Why?","Square any odd number. What do you notice about the remainder when ÷ 8?"] },
  { id:"proof", name:"Proof Studio", icon:"i-scroll", color:"purple",
    desc:"Move from ‘it works’ to ‘it must work’. Build watertight arguments.",
    tasks:["Prove the sum of two even numbers is even (let them be 2a and 2b…).","Prove √2 is irrational by contradiction.","Show the angles of a triangle sum to 180° using parallel lines."] },
  { id:"model", name:"Model & Simulate", icon:"i-globe", color:"green",
    desc:"Turn the real world into mathematics: growth, motion, money, epidemics.",
    tasks:["Model your savings with compound interest — when does it double?","A rumour spreads: each person tells 2 more per day. Model it.","Estimate how many litres of water your school uses per week."] },
  { id:"code", name:"Code & Compute", icon:"i-code", color:"orange",
    desc:"Use the built-in calculator notebook to explore mathematics computationally.",
    tasks:["Sum the first 100 natural numbers — then check with n(n+1)/2.","Generate the Fibonacci sequence. Divide neighbours — what appears?","Simulate 100 dice rolls — how close is each face to 1/6?"] },
];

ATLAS.CHAT_SUGGESTIONS = [
  "Help me understand solving linear equations",
  "Give me a fraction challenge",
  "What is the quadratic formula?",
  "Quiz me for Grade 8",
  "Explain π like I'm 7",
];
