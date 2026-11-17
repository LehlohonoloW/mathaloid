# MATHALOID Atlas 🪐

**New: a playable 3D maths and physics expedition.** Explore the Atlas Plateau, restore six field stations through experiments, and explain your discoveries. Three difficulty levels provide eighteen independently saved challenges. The existing learning companion remains available. See [the open-world guide](docs/open-world.md) for controls, verification and the development plan.

Track a destination with the compass, make a prediction, then compare it with your experiment's measured result. Field notes keep every trial, and the six regions now have distinct landmarks. Progress and predictions stay on this device and travel with your Atlas backup.

Run `bun run start`, then open `http://127.0.0.1:4173/#world`. No runtime packages or asset downloads are required.

**Every tab. One atlas. Endless mathematics.**

MATHALOID Atlas is a free, open-source, privacy-first mathematics learning companion that runs entirely in your browser — from Grade 1 counting to A-Level calculus and beyond. No accounts. No servers. No analytics. No ceiling.

> No ceilings. No limits. Just mathematics.

---

## ✨ What's inside

| Tab | What it does |
| --- | --- |
| 🏠 **Home** | Cosmic hub: chat with Mathaloid, focus timer, daily goal, review queue, passport radar, voice orb |
| 🗺️ **Pathfinder** | A recommended route through the whole curriculum, per grade and curriculum lens |
| 📗 **Learn** | Step-by-step lessons: Introduction → The Idea → Examples → Your Turn → Try It → Challenge |
| 🎮 **Play** | Six games that teach: Number Lab, Fraction Forge, Pattern Detective, Strategy Quest, Function Flight, Geometry Studio |
| 🧭 **Journey** | A living concept map — mathematics as a connected web, not a ladder |
| 📘 **Study** | Formula vault with worked examples, bookmarks and your own local notes |
| 📙 **Exam Arena** | Paper-style sessions, topic drills and full timed simulations |
| 🎯 **Arena** | Quick Drill / Timed / Mixed / Boss Challenge with a local-ghost leaderboard |
| 📊 **Data Desk** | Read, question and stress-test real datasets |
| ✨ **Frontier** | Conjecture Lab, Proof Studio, Model & Simulate, and a Code & Compute notebook |
| ⭐ **Passport** | Five-dimension mastery profile: Understand · Fluent · Apply · Reason · Create |
| 🎙️ **Voice Mode** | Hands-free maths using your browser's built-in speech engine |

## 🎓 Curriculum lenses — no ceiling

Switch lenses any time; nothing is ever locked:

- **CAPS** — South African national curriculum (Grades 1–12)
- **IEB** — assessment-depth lens on the same content
- **A Levels** — Cambridge International 9709 / 9231 pathway
- **Open Maths** — beyond any syllabus (Frontier territory)

The engine adapts difficulty with spaced repetition and a mastery model, so the same tool serves a 6-year-old learning to count and a matric or A-Level student preparing for finals.

## 🔐 Privacy, in plain words

- **Zero network requests** after the page loads — verify it in DevTools
- **No accounts, no analytics, no cookies, no third-party fonts or sounds**
- All progress lives in your browser's local storage on your device
- **Export / import** your data as a JSON backup from Settings — it only leaves your device when *you* move it
- "Erase everything" really erases everything

## 🚀 Run it

It's a static site — no build step, no dependencies.

```bash
# any static server works
python3 -m http.server 8080
# then open http://localhost:8080
```

Or just open `index.html` in a browser. Works offline once loaded.

### Deploy to GitHub Pages

1. In repository Settings → Pages, select **GitHub Actions** as the source.
2. Run `bun run release:check`, then push to `main`.
3. The workflow validates the committed documentation, packages public files and deploys the static site. Pull requests run validation without deploying.

`bun run pages:package` prints the temporary distribution directory. It contains the application, public docs, license and release notes; development tools, archives and QA evidence are excluded.

## ♿ Accessibility

- Keyboard-navigable views and concept map (WCAG 2.2 minded)
- Reduce-motion, text-size, density and high-contrast options in Settings
- Speech output (optional, device-local) and voice input where the browser supports it

## 🛠️ Structure

```
index.html      — shell, home cosmos, view containers
css/atlas.css   — cosmic theme, orbs, widgets, all views, responsive
js/data.js      — curriculum atlas: skills, lessons, journey graph, datasets, lenses
js/engine.js    — state, mastery model, spaced repetition, XP/streak/badges, question generators
js/app.js       — router, chat, views, games, quiz runner, voice, settings
```

## Documentation

Full docs live in [`docs/`](docs/README.md) — Markdown-canonical guides with a generated, themed portal at [`docs/index.html`](docs/index.html) (served on GitHub Pages at `/docs/`).

- Rebuild: `bun run docs:build` · Gate: `bun run docs:check` (Bun 1.3.14+, zero dependencies)
- Key reads: [Overview](docs/overview.md) · [Mathaloid Brain (AI)](docs/ai.md) · [Security & privacy](docs/security-privacy.md) · [Contributing](docs/contributing.md)

## 📄 License

[MIT](LICENSE) — fork it, remix it, translate it. Mathematics belongs to everyone.

---

*Powered by Lehro Solutions*
