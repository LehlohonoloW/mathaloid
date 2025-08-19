# Contributing to MATHALOID

Thanks for your interest in contributing! We aim for a welcoming, accessible learning tool.

## Development setup
- No build step required. Use any static server or open `index.html` directly.
- Recommended: VS Code + Live Server extension.

## Code style and principles
- Keep UI accessible: semantic HTML, proper ARIA, focus management, and reduced-motion support.
- Keep keyboard interactions intuitive: Up/Down scroll, Left/Right navigate focus, Enter/Space activate.
- Prefer small, focused PRs with clear descriptions.

## Testing checklist
- Tabs and mode buttons keyboard behavior
- Story mode delay (14s extra) and Skip Next during countdown
- Reduced Motion toggle disables parallax and avoids jank
- Audio priming + mute behavior

## Pull Requests
- Link related issues
- Describe the change and screenshots if UI is affected
- Add tests where appropriate (manual steps acceptable for now)

## License
By contributing, you agree that your contributions will be licensed under the MIT License.
