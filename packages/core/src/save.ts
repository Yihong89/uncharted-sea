/**
 * Saga2D 引擎核心 — 存档（纯 JSON 快照，可插 localStorage）
 */
export interface SaveSnapshot {
  [key: string]: unknown;
}

export interface SaveStorage {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

/** 默认使用 localStorage（浏览器纯静态可用）。 */
export const localStorageStorage: SaveStorage = {
  read: (k) => (typeof localStorage !== "undefined" ? localStorage.getItem(k) : null),
  write: (k, v) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(k, v);
  },
  remove: (k) => {
    if (typeof localStorage !== "undefined") localStorage.removeItem(k);
  },
};

/** 存档：把全局变量/flag/进度序列化成 JSON，便于 "抉择→多结局" 所需状态持久化。 */
export class Save {
  private data: SaveSnapshot = {};
  constructor(private storage: SaveStorage = localStorageStorage, private key = "saga2d") {}

  get<T>(k: string): T | undefined {
    return this.data[k] as T | undefined;
  }

  set(k: string, v: unknown): void {
    this.data[k] = v;
  }

  /** 立即持久化整个快照。 */
  persist(): void {
    this.storage.write(this.key, JSON.stringify(this.data));
  }

  load(): void {
    const raw = this.storage.read(this.key);
    if (raw) {
      try {
        this.data = JSON.parse(raw) as SaveSnapshot;
      } catch {
        this.data = {};
      }
    }
  }

  keyOf(k: string): string {
    return k;
  }
}
