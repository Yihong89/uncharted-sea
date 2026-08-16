# The Uncharted Sea — Gameplay & Engine Requirements (v0.1)

> The **first game** of the Saga2D engine (M3 "game-driven" sample).
> Goal: a **trade/story-driven** naval-cast adventure that also delivers **attractive combat**
> — barrage naval skirmishes + rare **KOF-style boarding duels** as high points.
>
> ⚠️ **See the latest design**: [`CORE-GAMEPLAY.md`](CORE-GAMEPLAY.md) is the authoritative,
> evolving blueprint (trade↔combat↔story loop). GAME-01 keeps the roster / params / layer-interface notes.

---

## 0. One-Line Positioning

> Run a trading firm across uncharted seas — buy low / sell high, escort convoys, invest in routes.
> On the way, weather storms, pirates, and story characters; when ships collide, **board and win a
> KOF-style 1v1 duel** that decides your cargo, reputation, and story thread — until you reach your ending.

- Working title: **The Uncharted Sea**
- Genre: naval adventure (**trade & story driven**; barrage naval combat + **limited-time boarding duels** + cast story + branching endings)
- Platform: Web (GitHub Pages, pure static)
- Engine: Saga2D (its first validation case)

> Authoritative evolving design: [`CORE-GAMEPLAY.md`](CORE-GAMEPLAY.md).


---

## 1. Balanced Triple (engine acceptance dimensions)

| Dimension | Design form | Validates engine layer |
|-----------|-------------|------------------------|
| **Action** | cannon parabolic-ballistics naval combat (physics-heavy) + light boarding | ActionLayer / matter-js |
| **Story** | free-exploration triggered events; choices shape direction & multiple endings | NarrativeLayer / ink |
| **Voice** | main crew + rivals, contrasting voices in monologues/dialogue | VoiceLayer (self-built) |

> Each item must appear in the first playable demo as the "requirement source" for engine interfaces.

---

## 2. Core Gameplay Loop

```
Sail the sea (manage wind / supplies / course)
   │
   ▼
Random events ▸ battle ▸ storm ▸ merchants ▸ ruins ▸ mystery island
   │                                   │
   ▼                                   ▼
combat(box-ballistics)/choice(shape)  recruit crew / trigger bond side-quests
   │                                   │
   ▼ ────────────────────────┘
crew growth + faction/reputation/bond change
   │
   ▼
leads to different endings (depends on accumulated global choices)
```

---

## 3. Action Layer: Naval Combat (physics-heavy)

- **Core**: cannons fire via **matter parabolic ballistics**, considering wind / gravity / elevation.
- Hit a hull/deck → fire, torn sails, crew loss; landing is the feel core.
- Player maneuvers the ship (turn / raise-lower sails) + aim & fire; different ship types (sloop / galleon / man-of-war).
- **ActionLayer interface needs**: `makeRigidBody`, `applyImpulse` (cannonball), `collision(handler)`, parabolic/wind physics, time scaling (slow-mo in combat).
- **Light action extra**: boarding combat as an optional side-quest (deferred, doesn't block v1).

---

## 4. Narrative Layer: Free Exploration + Choices → Multiple Endings (core innovation)

- **Non-linear layout**: the world is a sea chart; events appear in specific seas / timings based on **trigger conditions / global state** (event pool).
- **Choice system**: key events give options that affect global variables (reputation / faction / crew bond / trust); accumulated choices decide direction & ending.
- **Multiple endings**: at least 3 lines (road to sovereignty / peaceful expansion / retiring from fame, etc.).
- **Bond side-quests**: each crew member has their own side-story; completing it changes their dialogue, ability, and ending weight.
- **NarrativeLayer interface needs**: `choose(optionID)`, global var read/write, `flag(event-trigger condition)`, paragraph jump, **event pool / random trigger**, seamless combat-or-dialogue transition (bus).
- Story authors use **ink** syntax + (optionally) the official Inky editor.

---

## 5. Voice Layer: Multi-Voice Characters (character-first; voices decided)

> Consensus from selection phase: **VoiceLayer is self-built and dependency-agnostic**; it borrows
> `dsh-voice-core`'s **voice catalog / sequential playback queue / show-text-then-speak** ideas, but de-DSH's the interface.

**Three voice-source modes (for the deploy constraint):**
| Mode | Dev-time use | Public deploy |
|------|--------------|---------------|
| `local-stream` | Mac mini Qwen real-time | not used publicly |
| `pregen` | — | play pre-generated audio for fixed lines |
| `browser` | — | browser TTS fallback for dynamic text |

Character↔voice binding is filled in after the character-version is finalized (see §7 table).

---

## 6. Saga2D Layer Interface Requirements (Engine Focus Basis)

| Engine layer | Interfaces this game needs |
|--------------|----------------------------|
| Core | `Engine(start)`, `Scene`, light-ECS(query), event bus, Camera/parallax, Save(JSON→localStorage), Assets, i18n, time scale |
| ActionLayer | rigid body / ballistics / collision / hit, ship maneuvering, time slow-mo |
| NarrativeLayer | ink runtime, option panel, event-pool trigger, global vars/flag, multi-ending jump |
| VoiceLayer | `styles` catalog, `roles.bind(character→voice)`, `speak/stop/queue`, 3-mode switch |
| Adapter | IRenderer(Phaser), IPhysics(matter), INarrative(inkjs), ITTS(self-built) |

---

## 7. Character Table (voice decided, character-first)

| Code | Role | Prototype vibe | Voice | Speech style | Function |
|------|------|----------------|-------|--------------|----------|
| captain | protagonist · captain | fiery action leader | 🎙 **boy/youth voice** | fast-paced, action-driven, many exclamations | main operation / main-line choice |
| navigator | helmsman / guide | lively chatterer | 🎙 **loli voice** | cute, exclamatory, clingy | world-building expo, event guide |
| bosun | boatswain / veteran | warm, reliable | 🎙 **middle-aged man voice** | gravelly, easygoing, loves lessons/dry humor | naval command |
| surgeon | ship doctor | calm healer | 🎙 **cool female voice** | steady low tempo, clinical, brisk | choice mediation, bond side-quest |
| enemy_galley | pirate captain (rival) | cunning foe | 🎙 sly/assertive (to refine) | taunting, cynical | Boss duel, main-line rival |
| + some NPCs | merchant / hermit / castaway | — | appropriate per NPC | — | event trigger |

> Voices are derived from "character personality" (youth-loli-man-cool-villain), **not** forced — which neatly covers a five-way voice contrast.

---

## 8. Refined Gameplay (from design discussions, finalized)

### 8.1 World-map form
- **Local-continuous + region switching**: each region is a continuously explorable sea (**large scrollable camera**, immersive); regions connect via **segment-sailing transitions** (controlling per-region scale to avoid unbounded Open-World bulk).
- ActionLayer impact: **large scrollable camera**; Scenes connect via transitions.

### 8.2 Naval-combat feel
- **Heavy-prediction ballistic flow**: pronounced parabola, slow heavy shells, wind matters a lot — player must **lead the target / account for wind**.
- **v0.1 feel-param draft (to calibrate in M1):**
  - gravity `g ≈ 380 px/s²`
  - base shell speed `≈ 420 px/s`
  - wind influence `≈ 0~160 px/s²` (head/tail wind alters parabola symmetry)
  - hit feedback tiers: fire / sail-tear slow / crew loss

### 8.3 Ship types (3, first version)
| Ship | Trait | Reload interval |
|------|-------|:---:|
| Sloop (轻帆) | fast / nimble | 1.2s |
| Galleon (炮舰) | high firepower | 1.6s |
| Man-of-war (巨舰) | hp / slow / long range | 2.6s |

### 8.4 Economy (lightweight)
- Introduce **trade + supplies**: revenue for **upgrading sails / cannons / ship**; no heavy market-price/complexity.
- Rhythm payoff: between "pure combat" and "management sim".

---

## 9. Open / Pending

- How the final bilingual name is presented (`The Uncharted Sea` / 《未知海域》).
- v0.1 feel params need M1 calibration.
- Refine the rival / NPC specific voices.
- Economy numbers (prices / upgrade cost): v1 only does a minimal loop.

---

## 10. First Playable Demo (M3 milestone acceptance)

A minimal closed loop validating all three layers:
1. Sail into a continuous sea → trigger the first naval battle event.
2. Use **cannon ballistic physics** (matter curve) to sink / drive off the enemy.
3. After battle, trigger a **choice** (chase / let go / recruit), changing one global flag.
4. Have at least one **character conversation with voice** (local dev phase).

---

## 11. Related Docs

- Engine design: `../DESIGN.md`
- Repo-root README: `../README.md`

*Evolves with game & engine together.*
