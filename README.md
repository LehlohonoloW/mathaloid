# MATHALOID

An open-source, accessible math practice app with fun modes, smooth keyboard navigation, and an extended Story mode for reflection.

## Features
- Classic, Speed, Puzzle, and Story modes
- Keyboard navigation
  - Tabs and Mode buttons: Left/Right to move focus; Home/End to jump; Enter/Space to activate
  - Up/Down arrows scroll content naturally
- Story mode timing
  - Extra 14s delay after each answer (correct or incorrect)
  - Skip Next button available during the countdown
- Accessibility and UX
  - Roving tabindex for mode buttons, ARIA-friendly tabs/panels
  - Reduced Motion toggle that disables parallax effects
  - Audio priming on first user gesture (with mute toggle)
- State is persisted with localStorage

## Getting started
1. Clone the repository
2. Open `index.html` in your browser, or use a simple static server (e.g., VS Code Live Server)

No build step is required.

## Keyboard shortcuts quick reference
- Tabs/Mode selection: Left/Right, Home/End
- Activate selected tab/mode: Enter or Space
- Scroll content: Up/Down

## Story mode delay
- Total wait is approximately 16s (2s base + 14s extra). Use "Skip now" to proceed immediately.

## Development
- Main code in `app.js` and `index.html`
- Styles in `styles.css`
- Please read `CONTRIBUTING.md` before submitting PRs

## Deployment (GitHub Pages)
- This repo includes a GitHub Actions workflow to deploy the site to GitHub Pages from the `main` branch.
- After pushing to GitHub, enable Pages in the repo Settings and select "GitHub Actions" as the source.

## License
MIT — see `LICENSE`.
