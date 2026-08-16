/**
 * Saga2D 引擎核心 — 场景基类
 */
import { World } from "./ecs.js";
import { EventBus } from "./event-bus.js";

/** 场景生命周期钩子（语义对齐 Phaser，便于理解）。 */
export interface SceneContext {
  world: World;
  bus: EventBus;
  /** 相移：dt 秒；支持经 Camera 时间缩放。 */
  dt: number;
}

export abstract class Scene {
  abstract readonly key: string;

  /** 场景创建时调用（提前宽高、注册系统、初始化实体）。 */
  abstract create(ctx: SceneContext): void;

  /** 每帧更新（帧率无关语义）。 */
  abstract update(ctx: SceneContext): void;

  abstract destroy(ctx: SceneContext): void;
}
