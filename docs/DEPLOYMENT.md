# Saga2D — GitHub Pages Deployment Guide

> Answers the core question: **can the pnpm monorepo + TypeScript + Phaser/matter/ink architecture be shown on GitHub Pages?**

## Conclusion

**Yes.** Key premise: GitHub Pages is **pure-static hosting (HTML/JS/CSS only)**,
so you must NOT dump the monorepo's **source** onto it — you deploy the **build output (`dist/`)**.

```
monorepo source (pnpm + TS + Phaser/matter/ink)
        │  build (Vite/Rollup bundle)
        ▼
 dist/ output (pure html + bundled single js + assets)   ← what GitHub Pages can serve
```

---

## Why NOT to put the node architecture on Pages as-is

Browsers don't run TypeScript or bare `import` (especially workspace refs like `@saga2d/*` in a
monorepo), and they don't run Node. Putting raw source or the whole workspace on Pages would
404 / fail to run.

**Correct path:** use a bundler (**Vite**, most fitting for Phaser/Web) to build the game entry
into a single static site, and publish that `dist/`.

---

## Recommended Deploy Layout (Vite + Pages)

```
saga2d/
├─ packages/
│  ├─ core/            # engine core (compiled as a library)
│  ├─ layer-action/    # action layer
│  ├─ narrative/voice/ # …
│  └─ verify/          # ★ minimal-verification sample (a "deployable entry")
└─ games/
   └─ uncharted-sea/   # ★ the final game (itself buildable into a Pages site)
```

- **`verify/`** (M1) and **`games/uncharted-sea`** (later) are each **independent Vite apps**,
  each able to `vite build` into `dist/`.
- GitHub Pages uses **`gh-pages` branch** or **GitHub Actions** to publish some `games/xxx/dist/` as the site.

> Note: engine packages like `core` are **libraries** (bundled into verify/game); they don't go
> on Pages themselves, but verify/game's build packs them into `dist/`.

---

## M1 (minimal verification) deployability

We made `packages/verify` a **Vite app**:
- `pnpm dev` → local dev (Phaser canvas animates in the browser)
- `pnpm build` → outputs `packages/verify/dist/`
- that `dist/` pushed to GitHub Pages → shows live that "the engine minimal chain runs"

So from M1 onward every architecture step is "**buildable / deployable / viewable**", not local-only.

---

## Relation to "local TTS / Mac mini"

- **Deployed (Pages)**: pure static → cannot reach local `127.0.0.1` TTS.
  Voice on the deployed build runs **pregen (pre-generated audio)** or **browser TTS fallback** (see `DESIGN.md` §4.3).
- **Dev (local)**: may connect to Mac mini Qwen TTS real-time.
- Deployed vs dev voice behavior differs — that's expected design, not a bug.

---

## When to enable in the repo

We won't add `.github/workflows` deploy pipeline by hand in this monorepo yet (until a buildable
verify/game exists); then we'll use GitHub Actions to auto-build & publish. For now, get the
**build-output capability** right.

*Updated as the engine and games evolve.*
