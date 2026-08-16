import Phaser from "phaser";
import { feature } from "topojson-client";

/** TopoJSON 最小结构 */
interface MiniTopology {
  type: string;
  objects: Record<string, unknown>;
  arcs: unknown[];
  transform?: { scale: [number, number]; translate: [number, number] };
}

/** 完整世界坐标（经度 -180..180，纬度 -85..85，避开南极冰盖裸数据） */
export const WORLD_BBOX = {
  minLon: -180,
  maxLon: 180,
  minLat: -72,
  maxLat: 84,
  width: 360,
  height: 156,
};

/** 把 lon/lat 投影到 0..mapW × 0..mapH（等距圆柱） */
export function projectLatLon(lon: number, lat: number, mapW: number, mapH: number) {
  const b = WORLD_BBOX;
  const x = ((lon - b.minLon) / b.width) * mapW;
  const y = ((b.maxLat - lat) / b.height) * mapH;
  return { x, y };
}

/**
 * 完整世界陆地渲染器：从公域 Natural Earth land 数据，
 * 不做裁剪（完整世界），evenodd 处理挖洞。陆地分散真实，海洋天然为空。
 */
export class WorldLand {
  private shapes: { outer: number[][]; holes: number[][][] }[] = [];

  constructor(rawTopo: object, mapW: number, mapH: number) {
    this.collect(rawTopo, mapW, mapH);
  }

  private collect(rawTopo: object, mapW: number, mapH: number) {
    try {
      const topo = rawTopo as MiniTopology;
      const land = topo.objects.land;
      if (!land) return;
      const fc = feature(topo, land as never) as unknown as {
        features?: { geometry?: { type: string; coordinates?: number[][][][] } }[];
        geometry?: { type: string; coordinates?: number[][][][] };
      };
      const coords: number[][][][] =
        fc.features && fc.features.length
          ? (fc.features[0].geometry?.coordinates as number[][][][])
          : (fc.geometry?.coordinates as number[][][][]);
      for (const poly of coords) {
        const outer = this.projectRing(poly[0], mapW, mapH);
        const holes: number[][][] = [];
        for (let i = 1; i < poly.length; i++) {
          const h = this.projectRing(poly[i], mapW, mapH);
          if (h.length) holes.push(h);
        }
        if (outer.length) this.shapes.push({ outer, holes });
      }
    } catch (e) {
      console.warn("WorldLand collect failed:", (e as Error).message);
    }
  }

  private projectRing(ring: number[][], mapW: number, mapH: number): number[][] {
    // 跳过会 wrap antimeridian 的复杂情况：简单投影（等距圆柱）
    const out: number[][] = [];
    for (const [lon, lat] of ring as number[][]) {
      if (lat < WORLD_BBOX.minLat || lat > WORLD_BBOX.maxLat) continue;
      const p = projectLatLon(lon, lat, mapW, mapH);
      out.push([p.x, p.y]);
    }
    return out.length >= 3 ? out : [];
  }

  get shapeCount() {
    return this.shapes.length;
  }

  /** 画到离屏 canvas（默认 nonzero，外环正/洞反即挖洞）并生成 Phaser 纹理 */
  toPhaserKey(scene: Phaser.Scene, key: string, mapW: number, mapH: number, opts?: { landRGB: [number, number, number]; coast: string }) {
    const landRgb = opts?.landRGB ?? [216, 199, 154]; // 羊皮纸
    const coast = opts?.coast ?? "rgba(122,106,58,0.9)";
    const cv = document.createElement("canvas");
    cv.width = mapW;
    cv.height = mapH;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = `rgb(${landRgb[0]},${landRgb[1]},${landRgb[2]})`;
    for (const s of this.shapes) {
      ctx.beginPath();
      const o = s.outer;
      ctx.moveTo(o[0][0], o[0][1]);
      for (let i = 1; i < o.length; i++) ctx.lineTo(o[i][0], o[i][1]);
      ctx.closePath();
      // 洞：方向反转以挖洞（nonzero）
      for (const h of s.holes) {
        const rev = h.slice().reverse();
        ctx.moveTo(rev[0][0], rev[0][1]);
        for (let i = 1; i < rev.length; i++) ctx.lineTo(rev[i][0], rev[i][1]);
        ctx.closePath();
      }
      ctx.fill("evenodd");
    }
    // 海岸线
    ctx.strokeStyle = coast;
    ctx.lineWidth = 2;
    for (const s of this.shapes) {
      const o = s.outer;
      ctx.beginPath();
      ctx.moveTo(o[0][0], o[0][1]);
      for (let i = 1; i < o.length; i++) ctx.lineTo(o[i][0], o[i][1]);
      ctx.stroke();
    }
    return scene.textures.addCanvas(key, cv);
  }

  /** 海上装饰（复古海图风：罗盘风线） */
  static drawOceanDecoration(g: Phaser.GameObjects.Graphics, cx: number, cy: number, R: number) {
    g.lineStyle(1, 0x8a9a8a, 0.15);
    for (let a = 0; a < 360; a += 15) {
      const rad = (a * Math.PI) / 180;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(rad) * R, cy + Math.sin(rad) * R);
      g.strokePath();
    }
  }
}
