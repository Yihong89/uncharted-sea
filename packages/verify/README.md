# @saga2d/verify — Dual-Mode Naval Demo (M1)

Validates that the Saga2D engine "minimal chain" runs: **Phaser rendering + matter physics + Saga2D core engine integration + buildable static output**.

Deployed live at: https://yihong89.github.io/uncharted-sea/

## Run

```bash
pnpm install
pnpm dev         # local dev — open the Vite-printed URL
pnpm build       # output dist/ (deployable to GitHub Pages)
```

## Play (dual-mode)

- **Mode A · Sail** (top-down sea): `W/A/S/D` moves the ship freely over a full sea view.
- **Mode B · Fire** (side-view sea): press `Space` or `Enter` to switch to the side-view sea;
  `↑/↓` adjusts the cannon angle, `Space` fires a projectile showing a **clear parabolic arc** (rises then falls);
  hitting a moving target ship shows "命中!" and writes to localStorage.
  `BACKSPACE` or `ESC` returns to sail mode.

## Engine integration points

- Boots and runs the core chain with `@saga2d/core`'s `Engine` / `Scene` / `EventBus` / `Save`.
- Rendering/physics use Phaser (matter). Later the Saga2D `ActionLayer` will wrap this into `getBody` / `applyImpulse`-style interfaces.
- This demo is pure-static, buildable, deployable (no backend, no external assets — all procedural textures).

## Notes

`dist/` is the build output; serve it with any static server (`python -m http.server`) or deploy straight to GitHub Pages.
