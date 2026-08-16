/**
 * Saga2D 引擎核心 — 相机 / 视差
 */
export interface CameraOptions {
  width: number;
  height: number;
  followTarget?: { x: number; y: number };
}

/**
 * 世界↔屏幕变换。支持视差卷动（参考已验证的 bgOffset 思路）。
 * 本版本提供基础跟随与位置；视差由 Layer 提供多层相机扩展。
 */
export class Camera {
  readonly width: number;
  readonly height: number;
  /** 相机左上角在世界中的位置。 */
  x = 0;
  y = 0;
  /** 全局时间缩放（慢镜头）。 */
  timeScale = 1;
  private follow?: { x: number; y: number };

  constructor(opts: CameraOptions) {
    this.width = opts.width;
    this.height = opts.height;
    this.follow = opts.followTarget;
  }

  followTarget(t: { x: number; y: number } | undefined): void {
    this.follow = t;
  }

  /** 每帧更新：跟随目标居中。 */
  update(dt: number): void {
    void dt;
    if (this.follow) {
      this.x = this.follow.x - this.width / 2;
      this.y = this.follow.y - this.height / 2;
    }
  }

  /** 世界坐标 → 屏幕坐标。 */
  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return { x: wx - this.x, y: wy - this.y };
  }
}
