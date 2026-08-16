# Saga2D

> **Saga2D** — a general-purpose HTML5 2D game engine built on the shoulders of mature components.
> The name blends "Saga" (long-form narrative) with "2D". It is deeply tailored toward **action + narrative storytelling + multi-voice dialogue**.

Saga2D does not reinvent wheels; it **integrates proven components into one unified, pluggable, reusable 2D engine**, customized for the creative space of **action + narrative + multi-character voice**, and is ultimately meant to be **open-source for future developers**.

This file is the anchor of the engineering blueprint. Architecture and specs live in [`docs/DESIGN.md`](docs/DESIGN.md).

---

## One-Line Positioning

> Replace the tedious per-project wiring of render / physics / narrative glue —
> with a single engine whose **Adapter (swappable) + Core (stable) + Layer (pluggable)** layers turn "writing a game with dialogue and combat" into declarative configuration.

## Core Beliefs

1. **Don't reinvent the bottom layer** — rendering, physics, narrative, and TTS all stand on mature components (MIT / open-source).
2. **General without losing control** — the core is generic; action / narrative / voice are pluggable upper layers.
3. **Game-driven** — every engine capability is validated by a real, shipped game, to avoid "building endless frameworks".
4. **For future developers** — stable APIs, clear modules, runnable demos, and an explainable design document.

---

## Tech Stack (Decided)

| Layer | Choice | Rationale / Status |
|-------|--------|--------------------|
| Engine / render base | **Phaser** (40k★, MIT) | Scene / action / rendering built-in; largest community; pure-static deployable |
| Physics | **matter-js** (18k★, MIT) | 2D rigid-body standard; matches thrown / slingshot gameplay |
| Narrative | **ink / inkjs** (official web support) | Interactive narrative language with branches / vars / events; runs in pure browsers |
| Voice | **self-built VoiceLayer** (references `dsh-voice-core` ideas, not its code) | dsh-voice-core is DSH-specific (interface/context can't port); we build a **dependency-agnostic** voice layer borrowing only its proven patterns |
| Audio synthesis | WebAudio + Qwen3-TTS (local, reference-voice cloning) | already proven in dsh-voice-core |
| Deployment | **GitHub Pages (pure static, no backend)** | all components work statically |
| Language / build | **TypeScript + pnpm monorepo** | type-safe, fits open source; split into core/action/narrative/voice |

> ⚠️ **Deployment hard constraint**: target is pure-static hosting, so **no backend-requiring real-time cloud calls**. Voice follows the established boundary: local TTS only for pre-generation or LAN use; public deployment uses **pre-generated audio** or **browser built-in TTS** fallback.

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│                     Saga2D (general engine)                   │
├───────────────────────────────────────────────────────────────┤
│  Upper · Pluggable Layers (per-game, on demand)               │
│   ActionLayer     action / combat / physics feel              │
│   NarrativeLayer  story / branches / chars / events (ink)     │
│   VoiceLayer      multi-char TTS / subtitles / staging        │
├───────────────────────────────────────────────────────────────┤
│  Core · Stable Skeleton                                       │
│   Scene / Entity-Component / Input / Camera / game loop       │
│   / event bus / save / asset loading                          │
├───────────────────────────────────────────────────────────────┤
│  Adapter · Swappable (not tightly bound)                      │
│   Render=Phaser | Physics=matter-js | Narrative=inkjs         │
│   Audio=WebAudio+TTS (self-built VoiceLayer)                  │
└───────────────────────────────────────────────────────────────┘
```

---

## Status

- [x] Tech-stack research (Phaser / matter-js / ink / dsh-voice-core)
- [x] Architecture decision (Adapter-Core-Layer)
- [x] Design document draft (`docs/DESIGN.md`)
- [x] First game direction: **The Uncharted Sea** (naval cast adventure, see `docs/GAME-01.md`)
- [x] M1 engine skeleton + dual-mode naval demo (`packages/core`, `packages/verify`)
- [ ] M2 VoiceLayer v1
- [ ] M3 first playable game

---

## Related (existing infra / projects in the workspace)

- `dsh-voice-core` — **DSH-specific shared voice library**: DSH-bound interface cannot be reused by the engine. It does hold proven **ideas** (voice `styles` registry, fetch WAV→`<audio>` sequential playback queue, show-text-then-speak, local Qwen proxy) that the engine's **VoiceLayer** borrows when built independently.
- `dsh-sister` — DSH-side TTS host (`tts_service.py`, listens on `127.0.0.1:3091`) → a local-voice source option during development / on-LAN.
- `boomerang-ninja-demo.html` — procedural Canvas validation of action / particles / scenes → can inform design direction (engine's visual layer uses Phaser, not this implementation).

---

## Docs

- [`docs/DESIGN.md`](docs/DESIGN.md) — engine design document
- [`docs/GAME-01.md`](docs/GAME-01.md) — first game (The Uncharted Sea) gameplay & requirements
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — GitHub Pages deployment guide

*Docs evolve with the engine.*
