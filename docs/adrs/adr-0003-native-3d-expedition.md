---
title: ADR-0003 — Native 3D learning expedition
status: current
audience: contributors
useWhen: You change the game runtime, physics, saves or assessment.
summary: Add a native WebGL learning world while preserving the existing static, local-first Atlas and its zero runtime dependencies.
keywords: adr, webgl, 3d, physics, assessment, persistence
links: open-world, architecture, security-privacy
lastReviewed: 2026-11-11
---

## Context

The user requested that Mathaloid become a fun, interactive 3D open-world maths and physics game. Existing working-tree code introduced an incomplete Canvas perspective world and curriculum-linked monuments. A real learning-game loop requires experiments whose parameters and outcomes are part of the world, rather than only links to quizzes.

## Decision

Extend the existing static application with a continuous bounded landscape, native WebGL rendering, shared Canvas fallback, fixed-step player simulation and six physical experiment stations. Keep the companion learning tools and avoid runtime libraries, external assets and services. This extends ADR-0001; its privacy and dependency decisions remain in force. Native WebGL is a browser API, not a dependency.

Separate rendering, world simulation, learning definitions and UI. Validate physical inputs independently of the DOM. Save a versioned expedition object inside the existing Atlas state. A physical solution plus an explanation earns one completion reward per station/difficulty. Commit completion and XP together. Replays can be explored freely but cannot farm rewards. Record discoveries separately from quiz accuracy and mastery.

## Alternatives

Three.js or Babylon.js would provide mature scene management, materials and loaders, but introduce a new runtime dependency and a larger authoring/deployment change. A Unity or Unreal rewrite would provide richer tooling at a substantial cost to the current browser-first application. Keeping the former software-projection monument world would preserve implementation size but fall short of the requested gameplay.

## Consequences

Procedural meshes keep assets local and the initial world compact. The first slice has restricted physics models and a modest art budget. The Canvas fallback trades scenery detail and speed for reach; performance must be measured rather than assumed. Larger worlds, open-ended construction, multiplayer and certified curriculum alignment belong to later playable milestones with their own acceptance evidence.
