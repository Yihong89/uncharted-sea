/**
 * Saga2D 引擎核心 — 轻量实体（ECS 风格）
 */

/** 实体 id 类型 */
export type EntityId = number;

/** 组件：纯数据容器。任何可标识对象都可作为组件。 */
export interface Component {
  /** 可选：组件的类型标识，用于 query 匹配。 */
  readonly tag?: string;
}

/**
 * 轻量 ECS：
 *  - Entity 是带 id 的容器，挂若干组件；
 *  - System 遍历按组件条件过滤的实体。
 * 设计取舍：不引入重型 ECS 框架复杂度，多数 2D 游戏"轻组件 + 方向查询"足够。
 */
export class World {
  private nextId = 1;
  private alive = new Map<EntityId, Map<string, Component>>();
  private index = new Map<string, Set<EntityId>>();

  createEntity(): EntityId {
    const id = this.nextId++;
    this.alive.set(id, new Map());
    return id;
  }

  addComponent<T extends Component>(id: EntityId, component: T): T {
    const comps = this.alive.get(id);
    if (!comps) throw new Error(`entity ${id} 不存在`);
    const key = component.tag ?? component.constructor?.name ?? "default";
    const old = comps.get(key);
    if (old) this.removeFromIndex(id, key);
    comps.set(key, component);
    let ids = this.index.get(key);
    if (!ids) {
      ids = new Set();
      this.index.set(key, ids);
    }
    ids.add(id);
    return component;
  }

  getComponent<T extends Component>(id: EntityId, key: string): T | undefined {
    return this.alive.get(id)?.get(key) as T | undefined;
  }

  destroyEntity(id: EntityId): void {
    const comps = this.alive.get(id);
    if (!comps) return;
    comps.forEach((_, key) => this.removeFromIndex(id, key));
    this.alive.delete(id);
  }

  /** 按所需组件标签集合查询实体 id 列表。 */
  query(tags: string[]): EntityId[] {
    if (tags.length === 0) return [...this.alive.keys()];
    const first = this.index.get(tags[0]);
    if (!first) return [];
    const result: EntityId[] = [];
    first.forEach((id) => {
      const comps = this.alive.get(id);
      if (!comps) return;
      if (tags.slice(1).every((t) => comps.has(t))) result.push(id);
    });
    return result;
  }

  clear(): void {
    this.alive.clear();
    this.index.clear();
  }

  private removeFromIndex(id: EntityId, key: string): void {
    this.index.get(key)?.delete(id);
  }
}
