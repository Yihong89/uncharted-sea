# @saga2d/core — Saga2D Engine Core

The stable engine skeleton of Saga2D: Scene, entity system, event bus, camera, save, and assets.

## Modules

| Module | Purpose |
|--------|---------|
| `Engine` | game loop / scene scheduling (fixed/configurable timestep, time scaling) |
| `Scene` | scene lifecycle: `create` / `update` / `destroy` |
| `World` (light ECS) | entities with components; `query(tags[]) -> entityIds` |
| `EventBus` | `on` / `once` / `emit` / `off` with prefix convention (`fx:`/`game:`/`voice:`/`narrative:`) |
| `Camera` | world↔screen transform, follow-target, `timeScale` (slow-mo) |
| `Save` | pure-JSON snapshot -> localStorage (static deploy friendly) |
| `Assets` | load & key-reference images (audio / ink to come) |

## Design principles

- **Dependency-agnostic**: the core imports no concrete render/physics/narrative lib.
  Rendering, physics, etc. are plugged in via **Adapters** (`IRenderer`/`IPhysics`/`INarrative`/`ITTS`), so the core stays stable and swappable.
- **Light, not heavy**: a small ECS is enough for most 2D games; heavy framework complexity is avoided.
- **Game-driven**: interfaces are shaped by a real shipped game (see the monorepo's first-game docs).

## Usage

```ts
import { Engine, Scene, type SceneContext } from "@saga2d/core";

class MyScene extends Scene {
  key = "my";
  create(ctx: SceneContext) {
    ctx.bus.emit("game:start", { message: "scene ready" });
  }
  update(ctx: SceneContext) {}
  destroy(ctx: SceneContext) {}
}

const engine = new Engine({ initial: new MyScene() });
engine.start();
```

## Build

```bash
pnpm --filter @saga2d/core build   # tsc -> dist/
```
