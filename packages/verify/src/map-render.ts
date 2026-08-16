import Phaser from "phaser";
import { feature } from "topojson-client";

/** TopoJSON 最小结构 */
interface MiniTopology {
  type: string;
  objects: Record<string, unknown>;
  arcs: unknown[];
  transform?: { scale: [number, number]; translate: [number, number] };
}

/** 东亚-东南亚范围（经/纬度）：覆盖中国东部沿海、朝鲜半岛、日本列岛与整个东南亚 */
export const SEA_BBOX = {
  minLon: 92,
  maxLon: 155,
  minLat: -15,
  maxLat: 50,
  width: 155 - 92, // 63° lon
  height: 50 - -15, // 65° lat
};

/** 把 lon/lat 投影到 0..mapW × 0..mapH（等距圆柱） */
export function projectLatLon(lon: number, lat: number, mapW: number, mapH: number) {
  const b = SEA_BBOX;
  const x = ((lon - b.minLon) / b.width) * mapW;
  const y = ((b.maxLat - lat) / b.height) * mapH;
  return { x, y };
}

/**
 * 真实陆地渲染器：从 TopoJSON（公域 Natural Earth）解码 land 几何，
 * 裁剪东南亚区域，投影成 Canvas 多边形。1:1 还原真实轮廓。
 */
export class SeaLand {
  private polys: Phaser.Types.Math.Vector2Like[][] = [];

  constructor(rawTopo: object, mapW: number, mapH: number) {
    this.collect(rawTopo, mapW, mapH);
  }

  private collect(rawTopo: object, mapW: number, mapH: number) {
    try {
      const topo = rawTopo as MiniTopology;
      const land = topo.objects.land;
      if (!land) return;
      const fc = feature(topo, land as never) as unknown as {
        type: "FeatureCollection";
        features?: { geometry?: { type: string; coordinates?: number[][][][] } }[];
        geometry?: { type: string; coordinates?: number[][][][] };
      };
      // land 是 GeometryCollection → FeatureCollection；取每一条 feature 的 MultiPolygon
      const multipolys: number[][][][] = [];
      if (fc.features && fc.features.length) {
        for (const f of fc.features) {
          if (f.geometry?.coordinates) multipolys.push(f.geometry.coordinates);
        }
      } else if (fc.geometry?.coordinates) {
        multipolys.push(fc.geometry.coordinates);
      }
      for (const multi of multipolys) {
        for (const poly of multi) {
          const ring = poly[0]; // 外环
          const pts: Phaser.Types.Math.Vector2Like[] = [];
          for (const [lon, lat] of ring as number[][]) {
            if (lon < SEA_BBOX.minLon || lon > SEA_BBOX.maxLon) continue;
            if (lat < SEA_BBOX.minLat || lat > SEA_BBOX.maxLat) continue;
            const p = projectLatLon(lon, lat, mapW, mapH);
            pts.push({ x: p.x, y: p.y });
          }
          if (pts.length >= 3) this.polys.push(pts);
        }
      }
    } catch (e) {
      console.warn("SeaLand collect failed:", (e as Error).message);
    }
  }

  get polygonCount() {
    return this.polys.length;
  }

  /** 复古航海图风：羊皮纸陆地 + 海岸带 + 内陆色带 + 程序化山/林纹理 */
  draw(g: Phaser.GameObjects.Graphics, opts?: { parchment?: number; coast?: number; inland?: number }) {
    const parchment = opts?.parchment ?? 0xd8c79a; // 浅米黄羊皮纸
    const coast = opts?.coast ?? 0x2c5630;
    const inland = opts?.inland ?? 0x9a7a4a;
    // 1) 陆地主体（米黄羊皮纸）
    g.fillStyle(parchment, 1);
    for (const poly of this.polys) {
      if (poly.length < 3) continue;
      g.beginPath();
      g.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) g.lineTo(poly[i].x, poly[i].y);
      g.closePath();
      g.fillPath();
    }
    // 2) 海岸线（深色描边）
    g.lineStyle(3, coast, 0.85);
    for (const poly of this.polys) {
      if (poly.length < 3) continue;
      g.strokePoints(poly, true);
    }
    // 3) 内陆地形点（程序化伪高程）：在陆地多边形质心附近布点
    this.drawTerrainDots(g, inland);
  }

  /** 程序化内陆地形：在山地/高地随机撒点，形成"点状地形"的海图纹理 */
  private drawTerrainDots(g: Phaser.GameObjects.Graphics, inland: number) {
    // 用每个陆地多边形 bbox 内撒随机点，两点颜色深浅模拟高程/山林
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (const poly of this.polys) {
      // bbox
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of poly) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const w = maxX - minX, h = maxY - minY;
      if (w < 8 || h < 8) continue;
      const bumps = Math.floor((w * h) / 14000);
      for (let i = 0; i < bumps && i < 240; i++) {
        const dx = minX + rnd() * w;
        const dy = minY + rnd() * h;
        // 简单包容测试：用 Phaser 点是否在任意多边形内（粗略：仅画在 bbox，视觉近似）
        const shade = 0.5 + rnd() * 0.45;
        g.fillStyle(inland, shade * 0.6);
        g.fillCircle(dx, dy, 2 + rnd() * 3);
      }
    }
  }

  /** 海上装饰（复古海图风：罗盘风向线/细波纹） */
  static drawOceanDecoration(g: Phaser.GameObjects.Graphics, mapW: number, mapH: number) {
    g.lineStyle(1, 0x8a7a5a, 0.16);
    // 罗盘式风线（类似老海图的 rhumb lines）
    const cx = mapW / 2, cy = mapH / 2;
    const R = Math.max(mapW, mapH) * 0.75;
    for (let a = 0; a < 360; a += 12) {
      const rad = (a * Math.PI) / 180;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(rad) * R, cy + Math.sin(rad) * R);
      g.strokePath();
    }
  }
}
