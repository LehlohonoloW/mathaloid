# Immersive overview and local tutor

The default overview uses `assets/atlas-plateau.png` as its full-screen environment. Observatory, crossing and orbit-garden destinations open lessons, the playable world and practice. The original 3D expedition is available at `#world`. Artwork is concept art, not a capture of the playable world.

Mathaloid runs locally without an AI service or API key. The deterministic tutor supports numeric expressions, parentheses, powers, square roots, exact two-fraction arithmetic, percentages, mean/median/mode, and linear/quadratic equations in x. Worked equations include substitution checks. Decimal answers are rounded to ten significant figures. Existing built-in concept explanations and polynomial differentiation remain available.

Try `2(x + 3) = 18`, `1/2 + 1/3`, `15% of 240`, or `median of 2, 11, 4, 8`. Ask `why`, `show steps`, or `explain step 2` after a worked answer. Practice supports `hint`, `skip`, and numeric equivalents such as `0.5` for `1/2`. Quiz selection uses broad grade bands; it is not a comprehensive curriculum assessment.

The tutor does not provide unrestricted natural-language reasoning. Unsupported input needs clarification or a simpler expression. It does not solve arbitrary symbolic functions, multivariable equations or polynomials above degree two.

Verification: `bun run check`, `bun run test`, and `bun run pages:package`. Run `bun run test:tutor:browser` with Playwright installed or `ATLAS_PLAYWRIGHT_MODULE` pointing to an installed Playwright module. Browser coverage includes arithmetic, equation follow-ups, exact fractions, division by zero, quiz hint state, destination links, world entry, and viewport overflow at 1440px and 390px. Evidence is in `docs/.docs/evidence/immersive-*.png`. Firefox, Safari and physical devices have not been tested. The previous extended-world stale-tab recovery-warning failure remains unresolved; this change does not claim to fix it.
