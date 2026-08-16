# The Uncharted Sea — Core Gameplay Blueprint (v0.2)

> A refined blueprint after the "cannon-shooting isn't attractive" insight.
> Core is now **trade/story-driven**, with naval combat reworked as **barrage evasion + limited-time KOF-style boarding duels** as high points.

---

## 0. The Insight That Changed It

The original v0.1 made **cannon naval shooting** the core — which is a fine tech demo but **not attractive as a gameplay hook**. The game now leads with what actually draws players in:

- **trade company / story decisions** drive the player forward,
- **naval combat** is reworked to be tense but not the only thing,
- **boarding 1v1 duels (KOF-style)** serve as rare high-tension climaxes.

---

## 1. Core Position

> Run a trading firm on the Uncharted Sea: buy low & sell high, take convoy/escort contracts,
> invest in trade routes. On the way you face storms, pirates, and story characters —
> run the gauntlet of **enemy cannon fire**, then when ships collide, **board and fight a 1v1
> KOF-style duel** that decides whether you keep your cargo, reputation, and story thread.

---

## 2. The Trade ↔ Combat ↔ Story Loop (how the three interlock, not split)

```
Harbor trading: buy-low/sell-high, escort/convoy contracts, invest in routes
   │
   ▼ sail to a trade harbor
Random events: opportunities / pirates / storm / story characters
   │
   ├─ choose to fight (raid / defend cargo / revenge) ──▶ naval combat
   │       │   barrage phase: dodge enemy shells in tight approach
   │       │   boarding: ships collide ──▶ 1v1 KOF duel (guard/counter/special)
   │       │   win → keep cargo, gain reputation / rare goods / route
   ├─ choose to flee / negotiate (a decision, not a cop-out) ──▶ may lose some cargo/route
   │
   ▼
Profit + reputation + cargo → upgrade ship / recruit key crew → enter deeper seas / unlock story
   │
   ▼
Story choices → multiple endings
```

**Key: trade → motivates combat (protect what you earned), combat → feeds trade (cargo / routes).**
They are interlocked, not two separate mini-modes.

---

## 3. Trade & Story (the driving force)

- **Economy (lightweight, decided)**: port buy/sell + escort/convoy contracts + route investment;
  revenue upgrades ship sails / cannons / hull.
- **Story as the backbone**: fixed story beats interleave with the trading loop; hostile encounters
  and boarding duels are placed as **story high points against key rivals**.
- **Choices affect both trade and story**: raid a merchant's convoy for a quick fortune vs. honor your
  escort contract; each choice ripples into reputation/faction/ending weight.
- **Multi-ending** (≥3) driven by accumulated global choices.

---

## 4. Naval Combat (reworked, not the star but not filler)

### 4.1 Barrage phase — tension before boarding
- Player maneuvers the ship to **dodge the enemy's cannon fire** while narrowing the gap.
- Focus is **close-quarter tension + strategic approach**, not long-range trading shots.
- A hit hurts (cargo/reputation risk), but the goal is to **get alongside and board**.

### 4.2 Boarding duel — the high point (limited-time, KOF-style) ★
- When ships collide, enter **hardcore 1v1 fighting (KOF style)**: movement / punch / guard / counter / special moves.
- It is **reserved for special / boss / key-rival encounters** (not every fight) → stays rare, meaningful, exciting.
- Outcome decides that battle's stakes (keep cargo, gain reputation, advance story).
- **Fighting feel**: directional input + light/heavy attacks + guard + meter/specials (KOF-inspired).

### 4.3 Why "limited-time" matters
- The trade loop keeps its rhythm — ordinary fleet skirmishes resolve fast via barrage + sink.
- Boarding duels are **rare theatrical moments**, so each one lands with weight.

---

## 5. Interface needs on Saga2D Layers (updated)

| Engine layer | What this gameplay needs |
|--------------|--------------------------|
| Core | `Engine`, `Scene`, light-ECS, event bus, Camera/parallax, Save, Assets, i18n, time scale |
| ActionLayer | rigid bodies, barrage dodge (movement + collision-avoidance), ship maneuvers; **duel (input buffering, hitbox, guard/counter, combo, special meter)** |
| NarrativeLayer | ink runtime, options, event pool, global vars/flags, multi-ending |
| VoiceLayer | voice catalog, `roles.bind(char→voice)`, `speak/stop/queue`, 3-mode |
| Adapter | IRenderer(Phaser), IPhysics(matter), INarrative(inkjs), ITTS(self-built) |

> This design especially stresses **ActionLayer's fighting-duel subsystem** — a distinct, meaty module (input buffering, hitboxes, guard/counter, combo, special meter) that merits its own sub-spec.

---

## 6. Open / evolving

- Duel control scheme detail (input buffering / frames / move list) → to be settled in M2/M3.
- Whether barrage phase is a dedicated sub-scene or part of the over-world.
- Reconcile v0.1 cannon-param notes (§8 of GAME-01) into the new barrage/duel framing.

---

## 7. Related

- Gameplay details & roster: `GAME-01.md`
- Engine design: `DESIGN.md`

*Evolves with design discussions.*
