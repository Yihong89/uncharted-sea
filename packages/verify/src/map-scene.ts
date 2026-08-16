import Phaser from "phaser";
import { PORTS, MAP_W, MAP_H, START_PORT, ERA, type Port } from "./map-data.js";
import { SeaLand, projectLatLon } from "./map-render.js";

/**
 * 大地图场景（群岛世界 · 真实东南亚轮廓）
 *  - 用公域 Natural Earth 数据 1:1 渲染真实陆地轮廓（航海图风）
 *  - 港口标记（名 / 特产）
 *  - 船自由航行(WSAD/方向键) 或 点选港口自动导航
 *  - 靠岸 → 贸易 UI（可买卖，验证差价循环）
 */

interface ShipHold {
  goods: Record<string, number>; // 商品名 -> 数量
  gold: number;
}

export class MapScene extends Phaser.Scene {
  private ship!: MapShip; // 船逻辑位置 (x,y,vx,vy)
  private shipView!: Phaser.GameObjects.Container;
  private shipSprite!: Phaser.GameObjects.Image;
  private portMarks: Phaser.GameObjects.Container[] = [];
  private autoTarget: Port | null = null;
  private cursors!: KeyboardKeys;
  private uiText!: Phaser.GameObjects.Text;
  private cargoText!: Phaser.GameObjects.Text;
  private hold: ShipHold = { goods: {}, gold: 500 };
  private docked: Port | null = null;
  private camShake = 0;

  constructor() {
    super("map");
  }

  preload() {
    this.load.json("sea-land", "countries-110m.json");
  }

  create() {
    this.makeSea(); // 深蓝海 + 经纬网
    this.drawRealLand(); // 公域真实轮廓
    this.makeShipTexture();
    this.makePortMarks();

    // 船初始在新加坡位
    const sp = START_PORT;
    const sp0 = projectLatLon(sp.lon, sp.lat, MAP_W, MAP_H);
    this.ship = { x: sp0.x, y: sp0.y, vx: 0, vy: 0 };
    this.shipView = this.add.container(this.ship.x, this.ship.y, [
      this.add.ellipse(2, 8, 28, 10, 0x003311, 0.25),
      this.add.image(0, 0, "boat"),
    ]);
    this.shipSprite = this.shipView.list[1] as Phaser.GameObjects.Image;

    // 相机跟随船
    this.cameras.main.startFollow(this.shipView, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setZoom(0.7);

    // 键盘
    this.initKeys();
    // 点击港口导航
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const wx = this.ship.x;
      const wy = this.ship.y;
      void wx;
      void wy;
      // 找最近的港口（用世界坐标接近）
      const worldPos = this.cameras.main.getWorldPoint(p.x, p.y);
      let best: Port | null = null;
      let bestD = 70; // 点击容忍距离
      for (const port of PORTS) {
        const pp = portPoint(port);
        const d = Phaser.Math.Distance.Between(worldPos.x, worldPos.y, pp.x, pp.y);
        if (d < bestD) {
          bestD = d;
          best = port;
        }
      }
      if (best) {
        this.autoNavigate(best);
      }
    });

    // HUD
    this.uiText = this.add
      .text(16, 14, "", { fontSize: "14px", color: "#eaf6ff" })
      .setScrollFactor(0)
      .setDepth(50);
    this.cargoText = this.add
      .text(16, 120, "", { fontSize: "13px", color: "#ffd9a0" })
      .setScrollFactor(0)
      .setDepth(50);
    this.add
      .text(16, 40, ERA.label, { fontSize: "12px", color: "#bfe3ff" })
      .setScrollFactor(0)
      .setDepth(50);
  }

  update(time: number) {
    // 手动航行 or 自动导航
    if (this.autoTarget) {
      this.stepNavigate(time);
    } else {
      this.stepManual(time);
    }
    this.shipView.setPosition(this.ship.x, this.ship.y);
    this.shipSprite.setFlipX(this.ship.vx < 0);

    // 靠岸检测
    this.checkDock();
    this.updateHud();
  }

  // ---- 航行 ----
  private stepManual(time: number) {
    const sp = 3.0;
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown) dx -= 1;
    if (this.cursors.right.isDown) dx += 1;
    if (this.cursors.up.isDown) dy -= 1;
    if (this.cursors.down.isDown) dy += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      this.ship.x += (dx / len) * sp;
      this.ship.y += (dy / len) * sp;
      this.ship.vx = dx / len;
      this.ship.vy = dy / len;
      this.spray(this.ship.x, this.ship.y);
    } else {
      this.ship.vx = 0;
      this.ship.vy = 0;
    }
    this.ship.x = Phaser.Math.Clamp(this.ship.x, 20, MAP_W - 20);
    this.ship.y = Phaser.Math.Clamp(this.ship.y, 20, MAP_H - 20);
    void time;
  }

  private stepNavigate(time: number) {
    const target = this.autoTarget!;
    const pp = portPoint(target);
    const dx = pp.x - this.ship.x;
    const dy = pp.y - this.ship.y;
    const d = Math.hypot(dx, dy);
    if (d < 14) {
      // 抵达
      this.autoTarget = null;
      this.docked = target;
      this.openTrade(target);
      return;
    }
    const sp = 3.6;
    this.ship.x += (dx / d) * sp;
    this.ship.y += (dy / d) * sp;
    this.ship.vx = dx / d;
    this.ship.vy = dy / d;
    if (time % 8 < 2) this.spray(this.ship.x, this.ship.y);
  }

  private autoNavigate(port: Port) {
    this.autoTarget = port;
    this.docked = null;
  }

  private spray(x: number, y: number) {
    const p = this.add.circle(x, y + 10, 2, 0xcfefff, 0.8);
    this.tweens.add({
      targets: p,
      scaleX: 0.3,
      alpha: 0,
      duration: 400,
      onComplete: () => p.destroy(),
    });
  }

  private checkDock() {
    if (this.autoTarget || this.docked) return;
    for (const port of PORTS) {
      const pp = portPoint(port);
      if (Phaser.Math.Distance.Between(this.ship.x, this.ship.y, pp.x, pp.y) < 40) {
        // 手动驶入某港 → 停靠
        this.docked = port;
        this.openTrade(port);
        return;
      }
    }
  }

  // ---- 贸易 UI（简化：显示该港特产与你的货仓，按上下键切换数量，空格买卖）----
  private openTrade(port: Port) {
    this.docked = port;
    const lines: string[] = [];
    lines.push(`已停靠：${port.name}`);
    lines.push("── 本港特产 ──");
    for (const g of port.goods) {
      const effective = Math.round(g.basePrice * g.ratio);
      const yours = this.hold.goods[g.name] || 0;
      lines.push(
        `${g.name}  ${effective}金  (库存${yours})`
      );
    }
    lines.push("");
    lines.push("按 1 买 / 2 卖 / 0 离港");
    this.uiText.setText(lines.join("\n"));
  }

  private buy(port: Port, goodName: string) {
    const g = port.goods.find((x) => x.name === goodName);
    if (!g) return;
    const price = Math.round(g.basePrice * g.ratio);
    if (this.hold.gold >= price) {
      this.hold.gold -= price;
      this.hold.goods[goodName] = (this.hold.goods[goodName] || 0) + 1;
    }
  }

  private sell(port: Port, goodName: string) {
    const yours = this.hold.goods[goodName] || 0;
    if (yours <= 0) return;
    // 卖出价用该港"收"的比率——这里简化：同一商品在本港买价即卖价
    const g = port.goods.find((x) => x.name === goodName);
    if (!g) return;
    const price = Math.round(g.basePrice * g.ratio);
    this.hold.goods[goodName] = yours - 1;
    this.hold.gold += price;
  }

  private updateHud() {
    this.cargoText.setText(
      `🪙 金币 ${this.hold.gold}\n货仓: ${Object.entries(this.hold.goods)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${k}x${n}`)
        .join(" ") || "空"}`
    );
  }

  // ---- 渲染：海图 ----
  private makeSea() {
    const g = this.add.graphics().setDepth(-10);
    // 深海底色
    g.fillStyle(0x0a3a5a, 1);
    g.fillRect(0, 0, MAP_W, MAP_H);
    // 经纬网（航海图感）
    g.lineStyle(1, 0x2a5a7a, 0.22);
    for (let gx = 0; gx < MAP_W; gx += 100) {
      g.beginPath();
      g.moveTo(gx, 0);
      g.lineTo(gx, MAP_H);
      g.strokePath();
    }
    for (let gy = 0; gy < MAP_H; gy += 100) {
      g.beginPath();
      g.moveTo(0, gy);
      g.lineTo(MAP_W, gy);
      g.strokePath();
    }
  }

  /** 用公域 Natural Earth 数据渲染真实东南亚轮廓（航海图风：浅陆 + 海岸线） */
  private drawRealLand() {
    const json = this.cache.json.get("sea-land") as object;
    const seaLand = new SeaLand(json, MAP_W, MAP_H);
    const g = this.add.graphics().setDepth(-9);
    // 先铺海（若 SEA bbox 未铺满，深蓝兜底）
    g.fillStyle(0x0a3a5a, 1);
    g.fillRect(0, 0, MAP_W, MAP_H);
    // 陆地填充 + 海岸线
    seaLand.draw(g, 0x2c5630, 0x5a9360);
    console.log(`SeaLand: 渲染 ${seaLand.polygonCount} 个陆地多边形`);
  }

  private makePortMarks() {
    for (const port of PORTS) {
      const pp = portPoint(port);
      const mk = this.add.circle(pp.x, pp.y, 14, port.color, 1);
      mk.setStrokeStyle(3, 0xffffff, 0.9);
      const label = this.add
        .text(pp.x, pp.y + 22, port.name, {
          fontSize: "12px",
          color: "#fff",
          backgroundColor: "rgba(0,20,40,0.55)",
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5, 0);
      // 特产小字
      const goods = port.goods.map((x) => x.name).join("/");
      this.add
        .text(pp.x, pp.y + 40, goods, {
          fontSize: "10px",
          color: "#cfe4ff",
          backgroundColor: "rgba(0,20,40,0.4)",
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0.5, 0);
      // 起始港星标
      if (port.isStart) {
        this.add
          .text(pp.x, pp.y - 26, "★ 始发", { fontSize: "11px", color: "#ffd54f" })
          .setOrigin(0.5, 0.5);
      }
    }
  }

  private makeShipTexture() {
    const txt = this.textures.createCanvas("boat", 60, 44);
    const g = txt.getContext();
    g.fillStyle = "#5a401c";
    g.fillRect(4, 20, 52, 14);
    g.fillStyle = "#6b4a22";
    g.fillRect(0, 18, 60, 8);
    g.fillStyle = "#e8e0d0";
    g.fillRect(26, 2, 10, 18);
    g.fillStyle = "#c8d8e8";
    g.fillRect(42, 4, 8, 14);
    txt.refresh();
  }

  private initKeys() {
    const k = this.input.keyboard!;
    this.cursors = {
      left: k.addKey("A"),
      right: k.addKey("D"),
      up: k.addKey("W"),
      down: k.addKey("S"),
      left2: k.addKey("LEFT"),
      right2: k.addKey("RIGHT"),
      up2: k.addKey("UP"),
      down2: k.addKey("DOWN"),
      num1: k.addKey("ONE"),
      num2: k.addKey("TWO"),
      zero: k.addKey("ZERO"),
      space: k.addKey("SPACE"),
    };
    k.on("keydown-ONE", () => {
      if (this.docked) this.buy(this.docked, this.docked.goods[0].name);
    });
    k.on("keydown-TWO", () => {
      if (this.docked) this.sell(this.docked, this.docked.goods[0].name);
    });
    k.on("keydown-ZERO", () => {
      this.docked = null;
      this.autoTarget = null;
      this.uiText.setText("已离港");
    });
    k.on("keydown-SPACE", () => {
      this.autoTarget = null; // 取消导航
    });
  }
}

interface KeyboardKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left2: Phaser.Input.Keyboard.Key;
  right2: Phaser.Input.Keyboard.Key;
  up2: Phaser.Input.Keyboard.Key;
  down2: Phaser.Input.Keyboard.Key;
  num1: Phaser.Input.Keyboard.Key;
  num2: Phaser.Input.Keyboard.Key;
  zero: Phaser.Input.Keyboard.Key;
  space: Phaser.Input.Keyboard.Key;
}

/** 港口经纬度 → 世界坐标（与真实地图轮廓同一投影） */
function portPoint(p: Port): { x: number; y: number } {
  return projectLatLon(p.lon, p.lat, MAP_W, MAP_H);
}

interface MapShip {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
