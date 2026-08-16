# The Uncharted Sea — Trade & Story Loop Design (v0.1)

> Concrete design of the trade economy, how it triggers combat, and how it interlocks with the story.
> Supersedes the generic sketches in `CORE-GAMEPLAY.md` §2–§3 with concrete mechanics.

---

## 1. Economy: Regional Specialty Arbitrage + High-Risk High-Reward (decided)

### 1.1 Goods — regional specialty price spread
- Each region/port produces **specialty goods** cheap locally that sell high elsewhere (exploration reward).
- e.g. a spice island sells spices cheap; a northern port imports them at a premium.
- **Multi-labor, multiple reward**: the more routes you discover, the more profit potential.

### 1.2 Risk/reward — high risk, high reward
- **Venture deeper / riskier waters or carry large cargo → bigger profit, but higher chance of being raided.**
- The player weighs each trip: is the premium worth the raid risk?
- Risk is **player-negotiable gamble**, not a fixed penalty.

### 1.3 (Optional later) supply-demand spikes
- Base price spread from specialties + occasional random supply/demand surges (a localized shortage spikes a good's price) → both predictability and surprises.
- Not in v0.1 core; flagged as an extension.

---

## 2. Combat triggering (both active & passive, decided)

- **Active**: escort/convey **missions** the player opts into — protect a merchant fleet or a rare cargo;
  these can be ambushed en route → combat.
- **Passive**: being **raided by pirates** while sailing (player defends cargo or runs).
- Both feed back into reward: keep the cargo / earn escort pay / lose-and-avert-loss.

> Combat escalation per `CORE-GAMEPLAY.md`: barrage dodge → boarding → limited-time KOF duel (special encounters).

---

## 3. Narrative: weak main line + thick side content (decided)

- **Weak main line**: a light narrative spine gives direction without locking the player into railroaded play.
- **Thick side content**: many free exploration events + crew bond side-quests carry most of the flavor.

---

## 4. Story DRIVES trade (the lever, decided)

> Story progress **opens new routes / ports / specialty goods / characters**, making narrative the
> engine that expands trade. Avoids "mindless grinding".

- Completing a story beat unlocks a new sea region / trade route / specialty good → new profit frontier.
- New key crew members recruited through story bring trade/combat perks.

---

## 5. The resulting loop (concrete)

```
Choose a trading run (pick cargo & route, judge risk/reward)
   │
   ▼ sail
  - active: escort / convoy mission (player chose it)
  - passive: pirate raid (random)
   │
   ▼ encounter
  - negotiate / flee / fight → barrage dodge → maybe boarding KOF duel
   │
   ▼ outcome
  profit (+/-) + reputation + maybe rare goods / routes unlocked
   │
   ▼
fold profits into ship upgrade / recruitment → hit next story beat
   │  story unlock → new routes / goods / characters
   ▼
progress toward multi-endings
```

---

## 6. On the Saga2D layers

- **Core**: Save (gold/reputation/route flags), EventBus (trade/combat/story signals), Scene (port sea, combat, duel), Assets.
- **ActionLayer**: barrage dodge (ship maneuver + collision-avoid), boarding, **fighting-duel subsystem (KOF: input buffer, hitbox, guard/counter, combo, meter)**.
- **NarrativeLayer**: ink story beats + event pool + flags/global vars + multi-ending; event→combat/duel transitions via bus.
- **VoiceLayer**: characters for escort NPCs, pirate captains, story cast; 3-mode TTS.

---

## 7. Open / to refine

- Concrete price tables / route map / region list → to be built when a route-data layer lands.
- Number tuning for risk vs reward balance.
- Duel mechanics spec (frames/moves) → next (M2/M3 focus).

---

## Related

- `CORE-GAMEPLAY.md` — authoritative gameplay blueprint
- `GAME-01.md` — cast / params / layer interface notes
- `DESIGN.md` — engine design

*Evolves with design.*
