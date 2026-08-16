/**
 * Saga2D 引擎核心 — 事件总线
 */
export type EventHandler = (payload: unknown) => void;

/**
 * 事件总线：游戏层事件与引擎内部事件统一在此流转。
 * 命名前缀约定：`fx:` 引擎内部 / `game:` 游戏 / `voice:` 语音 / `narrative:` 剧情。
 */
export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on(event: string, fn: EventHandler): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(fn);
    return () => this.off(event, fn);
  }

  once(event: string, fn: EventHandler): () => void {
    const wrapper: EventHandler = (payload) => {
      this.off(event, wrapper);
      fn(payload);
    };
    return this.on(event, wrapper);
  }

  off(event: string, fn: EventHandler): void {
    this.handlers.get(event)?.delete(fn);
  }

  emit(event: string, payload?: unknown): void {
    this.handlers.get(event)?.forEach((fn) => fn(payload));
  }

  clear(): void {
    this.handlers.clear();
  }
}
