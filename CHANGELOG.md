# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-11-17
### Added
- Atlas Plateau: six interactive maths and physics stations, three difficulty levels and eighteen saved discoveries.
- Prediction evidence, immediate trial notes, explanation-based rewards and replay-safe XP.
- WebGL rendering with Canvas fallback, map travel, keyboard/touch controls and remappable bindings.
- Automated simulation, persistence, geometry and full-browser verification.

### Changed
- Expedition is the default entry; the existing learning companion remains available.
- Backups validate nested data; stale tabs cannot overwrite newer saves, and storage failures show recovery guidance.
- GitHub Pages packages only public application and documentation files; pull requests run validation without deployment.
- Bun 1.3.14 runs the dependency-free checks, docs pipeline and local server.

### Known limitations
- Canvas fallback traversal performance and representative school-device benchmarks remain release gates. Functional browser checks do not establish learning outcomes or assistive-technology compatibility.

## [1.0.0] - 2025-08-18
### Added
- Initial open-source release of MATHALOID
- Keyboard navigation for tabs and mode buttons (Left/Right/Home/End; Enter/Space to activate; Up/Down scroll)
- Story mode with extended reflection delay (+14s, correct and incorrect) and Skip Next
- Reduced Motion toggle controls parallax effects
- Audio priming on first user gesture; mute toggle
- State persistence with localStorage

### Changed
- Branding updated to MATHALOID

## Progress Update - 2026-02-25

- Upgraded core UI to a more immersive, tactile experience with improved interaction feedback and motion.
- Added Learning Coach enhancements, dynamic hinting, and stronger educational reinforcement during gameplay.
- Implemented richer game-feel systems: combo indicator, celebratory effects, step-by-step solution reveal, and smarter mascot messaging.
- Expanded progress UX with operation mastery tracking, extended achievements, and clearer performance indicators.
- Improved accessibility and control reliability (reduce-motion handling, keyboard flow, and verified button behavior).
- Added in-UI footer credit: Powered by Lehro Solutions, with increased visibility styling.
