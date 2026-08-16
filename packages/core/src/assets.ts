/**
 * Saga2D 引擎核心 — 资源加载
 */
export interface AssetManagerOptions {
  /** 图片加载函数；默认用 Image。 */
  loadImage?: (src: string) => Promise<HTMLImageElement>;
}

const defaultLoadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败: ${src}`));
    img.src = src;
  });

/** 轻量资源缓存：图片/音频由 key 引用。 */
export class Assets {
  private images = new Map<string, HTMLImageElement>();
  private loadImageFn: (src: string) => Promise<HTMLImageElement>;

  constructor(opts: AssetManagerOptions = {}) {
    this.loadImageFn = opts.loadImage ?? defaultLoadImage;
  }

  async loadImage(key: string, src: string): Promise<HTMLImageElement> {
    const cached = this.images.get(key);
    if (cached) return cached;
    const img = await this.loadImageFn(src);
    this.images.set(key, img);
    return img;
  }

  getImage(key: string): HTMLImageElement | undefined {
    return this.images.get(key);
  }

  has(key: string): boolean {
    return this.images.has(key);
  }
}
