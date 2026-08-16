/**
 * Saga2D 引擎核心 — 引擎（主循环 / 场景调度）
 */
import { Scene } from "./scene.js";
import { World } from "./ecs.js";
import { EventBus } from "./event-bus.js";
import { Camera } from "./camera.js";

export interface EngineOptions {
  /** 初始场景 */
  initial: Scene;
  /** 固定/最大时间步（秒）。默认 1/60。 */
  fixedStep?: number;
}

/**
 * 引擎：以 rAF 驱动 update 循环。Scene 内自行处理渲染（经 Layer/Adapter）。
 * 本类负责时间步进与帧率无关的时间累积；场景逻辑用 dt(秒) 语义。
 */
export class Engine {
  readonly world = new World();
  readonly bus = new EventBus();
  camera: Camera;
  private current: Scene;
  private fixedStep: number;
  private raf = 0;
  private running = false;
  private lastTime = 0;

  constructor(opts: EngineOptions) {
    this.current = opts.initial;
    this.fixedStep = opts.fixedStep ?? 1 / 60;
    this.camera = new Camera({ width: 800, height: 600 });
  }

  get scene(): Scene {
    return this.current;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.current.create({ world: this.world, bus: this.bus, dt: 0 });
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  /** 切换场景（会销毁旧场景）。 */
  setScene(next: Scene): void {
    const ctx = { world: this.world, bus: this.bus, dt: 0 };
    this.current.destroy(ctx);
    this.current = next;
    next.create(ctx);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const dtRaw = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    const dt = dtRaw * this.camera.timeScale;
    this.current.update({ world: this.world, bus: this.bus, dt });
    this.raf = requestAnimationFrame(this.tick);
  };
}
