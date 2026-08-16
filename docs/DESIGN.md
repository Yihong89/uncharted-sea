# Saga2D — Engine Design Document (v0.1 draft)

> This document is the **engineering blueprint** for **Saga2D** (Saga narrative + 2D), a general-purpose 2D HTML5 engine.
> Audience: future collaborators, game developers using the engine, and maintainers.
> Status: **draft** — revised as the first game drives iteration.

---

## 0. Vision & Boundaries

**Vision:** writing a game with "combat + story + multi-character voice" should be like filling out a declarative config — not re-gluing Phaser, matter-js, ink, and TTS together each time.

**Boundaries (important, to avoid bloat):**
- Saga2D is an **upper-level integration engine**; it does NOT reinvent the bottom wheels (render / physics / narrative / synthesis).
- The core is meant to be **generic**; action / narrative / voice are **pluggable upper layers (Layers)**.
- Every capability is **validated by a real, shipped game** — no "pure framework building".
- Deployment targets **pure-static hosting such as GitHub Pages** → the engine introduces **no backend-requiring real-time cloud dependency**.

**Quality pillars:** stable APIs · clear modules · runnable demo · explainable design doc.

---

## 1. Dependency Selection (Locked)

| Layer | Dependency | License | Notes |
|-------|-----------|---------|-------|
| Render / engine base | **Phaser** | MIT | scenes / actions / sprites / animation / input built-in |
| Physics | **matter-js** | MIT | 2D rigid-body physics; also wrapped inside Phaser, can be used standalone |
| Narrative | **ink** (+ **inkjs** browser runtime) | MIT | branches / variables / events / jump |
| Voice synthesis | **Qwen3-TTS** (local, reference-voice cloning) | open (Qwen) | wrapped by the self-built VoiceLayer |
| Audio playback | WebAudio + `<audio>` | — | browser native |
| Language / build | **TypeScript + pnpm monorepo** | MIT | type-safe; split into core/action/narrative/voice |

> **Explicitly NOT chosen as base**: any DSH-specific library (e.g. `dsh-voice-core`). Its ideas are borrowed, its interfaces are not reusable (see §4.3).

---

## 2. Architecture: Adapter – Core – Layer

```
                ┌──────────────────────────────────────────┐
                │                  Saga2D                  │
                ├──────────────────────────────────────────┤
  Pluggable     │  ActionLayer    action / combat / feel   │
  upper layers  │  NarrativeLayer story/branch/char(ink)   │
                │  VoiceLayer     multi-char TTS / staging │
                ├──────────────────────────────────────────┤
  Stable Core   │  Scene · ECS · Input · Camera · Bus      │
  (the engine)  │  · timer loop · Save · asset loading     │
                ├──────────────────────────────────────────┤
  Swappable     │  Render=Phaser | Physics=matter-js       │
  Adapter       │  Narrative=inkjs | Audio=WebAudio+voice  │
                └──────────────────────────────────────────┘
```

**Dependency direction (the single constraint that prevents rot):**
- `Layer → Core → Adapter`, one-way. Above Core, no concrete lib is visible.
- Game code depends only on the **public API of Core + chosen Layers**; never directly `import Phaser` / `matter` / `ink` (except inside a Layer).

---

## 3. Middle Layer: Core (stable skeleton)

Core is where "generic" and "not over-engineered" meet. It doesn't care what you're playing; it cares how the game runs.

### 3.1 Timing & game loop
- `Engine.start(scenes)` → fixed / configurable timestep (supports time scaling for slow-mo).
- `Scene.lifecycle`: `create / update / render / destroy` (semantics aligned with Phaser for easy understanding).

### 3.2 Entity system (light ECS)
- `Entity` is an id-keyed container; `Component` is pure data; `System` iterates and processes.
- Provides `query(components[]) -> entities`.
- **Why light**: we want generic, but not the complexity of a heavy ECS framework. Most 2D games suffice with "light components + directional queries".

### 3.3 Event bus
- `bus.emit(event, payload)` / `bus.on(event, fn)`.
- Game-layer events are isolated from engine-internal ones (prefix convention: `fx:` engine / `game:` game / `voice:` voice / `narrative:` story).
- The bus is the **key channel between NarrativeLayer and ActionLayer** (trigger battle from dialogue; advance story after victory).

### 3.4 Camera / parallax
- `Camera` handles world↔screen transforms; parallax supports layered scrolling (based on the proven `bgOffset` idea).

### 3.5 Save / assets / i18n
- `Save`: pure JSON snapshot, pluggable into localStorage (static deploy, no backend).
- `Assets`: load & key-reference images / audio / ink scripts.
- `i18n`: dialogue text and friendly character names independent of logic (Chinese-first content).

---

## 4. Upper Layers (pluggable) & the self-built core

### 4.1 ActionLayer
- Thin wrapper over Phaser scenes/sprites + matter-js rigid bodies.
- Public surface: `makeRigidBody(shape)`, `applyImpulse`, `collision(handler)`, `timeScale`.
- Carries thrown / slingshot / boomerang-style gameplay (proven by matter official demos).
- **Feel params** (jump inertia, hit-stun, hit frames) are config items, not magic numbers.

### 4.2 NarrativeLayer
- Based on **ink/inkjs** — it already solves branching / variables / conditions / event triggers.
- Saga2D adds: **UI staging** — typewriter, character sprites, name box, subtitles, option panel.
- Bridge to ActionLayer: ink `{{}}` / tags can emit `game:` events to trigger combat, switch scenes, adjust affection.
- (Borrows ink's official Inky editor ecosystem so story authors can author visually.)

### 4.3 VoiceLayer ★ self-built original

> **Premise correction**: do not directly reuse `dsh-voice-core` (DSH-specific). Borrow its proven **ideas**, and rebuild a dependency-agnostic voice layer within the engine.

**Ideas borrowed from dsh-voice-core:**
- **Voice catalog**: `styles = { onee:{...}, loli:{...} }` and `defaultStyle`.
- **Sequential playback queue**: fetch WAV → `<audio>`, serial, non-overlapping.
- **Show text first, then speak**: matches the "subtitles + voice" staging.
- **Character → voice binding**: each character has a fixed instruct / reference audio.

**Saga2D VoiceLayer's own (de-DSH'd) interface:**
```js
voice.styles.add('loli', { instruct: "…a cute loli voice…", refAudio: "assets/ref/loli.wav", lang:'zh' })
voice.roles.bind('npc_mei', 'loli')          // bind character to a voice
await voice.speak('npc_mei', '你来啦，主人！') // speak one line (subtitle+voice, awaitable)
voice.stop('npc_mei')                        // interrupt
voice.onLineStart / onLineEnd                // staging hooks (mouth / subtitle blink)
```

**Three voice-source modes (important for the deployment constraint):**
| Mode | When | Notes |
|------|------|-------|
| `local-stream` | dev / LAN | Mac mini Qwen real-time (via adapter, not a hard dependency) |
| `pregen` | public-deploy fixed lines | play pre-generated audio files; zero latency, zero backend |
| `browser` | public-deploy dynamic text | browser built-in `speechSynthesis` fallback |

> Switch via `voice.mode`; game logic is unaware.

### 4.4 Three-layer collaboration example (proves the design)

```
Player enters dojo → NarrativeLayer plays intro (ink)
   → ink triggers game:battle → switch to ActionLayer combat (matter + boomerang)
   → victory → bus notifies NarrativeLayer → continue story + character voice (voice.speak)
   → save (Save layer)
```

---

## 5. Bottom Layer: Adapter (swappable, not tightly bound)

Core/Layers depend only on **abstract interfaces**, not concrete libraries:

| Interface | Current impl | Swappable to |
|-----------|--------------|--------------|
| `IRenderer` (draw sprite/render/global alpha/filters) | Phaser | PixiJS / self-drawn Canvas |
| `IPhysics` (body / impulse / collision / raycast) | matter-js | planck.js / p2 |
| `INarrative` (choose / var / flag / next) | inkjs | Yarn Spinner runtime |
| `ITTS` (styles / bind / speak / stop / queue / mode) | self-built VoiceLayer | any cloud TTS |

> If a library is abandoned, grows too large, or we want to swap, change it at the Adapter → game logic is unaffected.
> This is the dividing line between "a general engine" and "an integration script".

---

## 6. Naming

**Finalized: Saga2D** ("Saga / long-form narrative" + "2D"). Rejected as colliding / lacking distinction: **Folklore** (same name on npm & GitHub), **web-engine** (2.7万 GitHub hits), **saga / fable** (npm taken).

| Candidate | Verdict |
|-----------|---------|
| **Saga2D** | ✅ final: unique, memorable, conveys narrative + engine |
| inktell | backup (echoes ink), not adopted |
| web-engine / Folklore / saga / fable | ❌ rejected (collision / too generic) |

> Do a final npm / GitHub-org de-dup before public release.

---

## 7. Milestones (game-driven, to avoid losing control)

| Milestone | Goal | Deliverable |
|-----------|------|-------------|
| **M0 · Docs** | blueprint alignment | this doc + README (in progress) |
| **M1 · Minimal engine core** | Phaser+matter+ink chain runs | `Core+Minimal`, a "runs / dialogues / physical" shell demo |
| **M2 · VoiceLayer v1** | line → character → voice | subtitles + local voice (dev) working; public-deploy fallback explainable |
| **M3 · First real game** | a small complete game with these components | playable demo (drive/extract engine interfaces) |
| **M4 · Engine generalization** | extract Layer/Core/Adapter from M3 | finalized generic API, complete examples/ |
| **M5 · Open source** | for future developers | README / docs / license / examples / CI ready |

> **Golden rule**: any "engine capability" must be able to point to which game validated it; otherwise it doesn't get implemented.

---

## 8. Directory Layout (suggested)

```
saga2d/   (or monorepo root)
├─ docs/           # design docs, ADRs
├─ packages/
│  ├─ core/        # engine core (Scene/ECS/Bus/Input/Camera/Save/Assets)
│  ├─ layer-action/    # action layer
│  ├─ layer-narrative/ # narrative layer (ink)
│  ├─ layer-voice/     # voice layer (self-built, TTS 3-mode)
│  └─ adapter-*/       # render/physics etc. adapter impls
├─ games/          # games built with the engine (one subdir each)
│  └─ uncharted-sea/   # The Uncharted Sea
├─ examples/       # minimal runnable example per module
└─ README.md
```

---

## 9. Decisions & Open Questions

**Decided**
- Phaser base + matter-js + inkjs; don't build the bottom layers ourselves.
- VoiceLayer is **self-built, dependency-agnostic**; `dsh-voice-core` is a reference only.
- Pure-static deploy; public voice uses pregen / browser fallback.
- Engine name **Saga2D**; language **TypeScript**; build **pnpm monorepo**.
- First game: **The Uncharted Sea** (naval cast; see `GAME-01.md`).

**Open / pending**
- Engine package name locked by final npm/GitHub-org de-dup.
- Naval combat feel params + world-map shape (tile chart vs continuous) → validated in M1/M2.
- Full character roster & voice mapping (filled after the character version is finalized).
- Whether to introduce an economy system (trade / supplies).

---

## 10. References

- Phaser — https://phaser.io
- matter-js — https://brm.io/matter-js
- ink / inkjs — https://github.com/inkle/ink
- dsh-voice-core (idea reference, not reuse) — in this workspace
- Boomerang ninja demo (direction / visual reference) — in this workspace

---

*This doc updates as each milestone completes.*
