# Frontend audit ? 17 November 2026

Fixed a confirmed Orbit Garden/tutor overlap at 1160px by reserving an independent area for landscape destinations. Replaced negative mobile destination margins with normal document flow. Mobile navigation now sits above content instead of covering the chat composer. Increased reading sizes, muted-text contrast, panel opacity, touch target sizes and label wrapping; reduced mobile toolkit columns.

Browser checks: 320, 390, 768, 801, 900, 1024, 1160 and 1440px home layouts without destination/tutor collisions or horizontal overflow. Twelve learning routes pass overflow checks at 390, 900 and 1440px. Tutor and world-entry integration passes. Screenshots: evidence/audit-390.png, audit-1160.png and audit-1440.png. These checks do not prove every possible user-authored text or physical device layout.

Release verification: 34 passing automated tests, one optional real-renderer test skipped; syntax, documentation freshness and public-site packaging pass. Prior GitHub Actions run 44074152344 failed on 22 stale documentation counterparts. Rebuilt all generated docs and normalized source line endings before hashing, preventing Windows/Linux checksum differences. Remote deployment must be checked after push.
