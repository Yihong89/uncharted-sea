import Phaser from "phaser";
import { feature } from "topojson-client";

/** TopoJSON 最小结构 */
interface MiniTopology {
  type: string;
  objects: Record<string, unknown>;
  arcs: unknown[];
  transform?: { scale: [number, number]; translate: [number, number] };
}

/** 东南亚范围（经/纬度） */
export const SEA_BBOX = {
  minLon: 92,
  maxLon: 142,
  minLat: -12,
  maxLat: 26,
  width: 50, // 50° lon span
  height: 38, // 38° lat span
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

  /** 画到目标 graphics：陆地填充 + 海岸线 */
  draw(g: Phaser.GameObjects.Graphics, landFill: number, coast: number) {
    g.fillStyle(landFill, 1);
    for (const poly of this.polys) {
      if (poly.length < 3) continue;
      g.beginPath();
      g.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) g.lineTo(poly[i].x, poly[i].y);
      g.closePath();
      g.fillPath();
    }
    g.lineStyle(2, coast, 0.9);
    for (const poly of this.polys) {
      if (poly.length < 3) continue;
      g.strokePoints(poly, true);
    }
  }
}
