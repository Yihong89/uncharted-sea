import Phaser from "phaser";
import { Engine, Scene, type SceneContext, Save } from "@saga2d/core";

const W = 900;
const H = 600;

/**
 * 《未知海域》双模式海战最小 demo：
 *  - 模式A「航行」：俯视海面，船上下左右自由移动（方向键/WSAD）
 *  - 模式B「发射」：按空格切换侧面海，船在侧面海面，↑/↓微调炮口角度，
 *                   空格发射炮弹，划出明显的抛物线弧线（可微调提高命中率）
 * 用 @saga2d/core 的 Engine 启动，Save 持久化命中数。
 */

// 模式A · 俯视海面场景
class SailScene extends Phaser.Scene {
  private boat!: Phaser.GameObjects.Container;
  private boatSprite!: Phaser.GameObjects.Image;
  private boatShadow!: Phaser.GameObjects.Ellipse;
  private waves = new Array<{ x: number; y: number; w: number; sp: number }>();
  private cursors!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
  };
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super("sail");
  }

  create() {
    this.makeSea(); // 俯视海面
    this.makeBoatTexture();

    this.boatSprite = this.add.image(0, 0, "boat");
    this.boatShadow = this.add.ellipse(6, 10, 34, 12, 0x003311, 0.25);
    this.boat = this.add.container(W / 2, H / 2, [this.boatShadow, this.boatSprite]);

    this.cursors = {
      left: this.input.keyboard!.addKey("A"),
      right: this.input.keyboard!.addKey("D"),
      up: this.input.keyboard!.addKey("W"),
      down: this.input.keyboard!.addKey("S"),
    };
    this.input.keyboard!.on("keydown-SPACE", () => this.scene.start("fire"));
    this.input.keyboard!.on("keydown-ENTER", () => this.scene.start("fire"));

    // 指示
    this.hint = this.add
      .text(W / 2, H - 24, "W/A/S/D 移动 · 空格 进入发射模式", {
        fontSize: "13px",
        color: "#eaf6ff",
      })
      .setOrigin(0.5);
    this.add
      .text(14, 14, "航行模式 · 俯视海面", { fontSize: "15px", color: "#bfe3ff" })
      .setDepth(20);
  }

  update(time: number) {
    const sp = 3.2;
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown) dx -= 1;
    if (this.cursors.right.isDown) dx += 1;
    if (this.cursors.up.isDown) dy -= 1;
    if (this.cursors.down.isDown) dy += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      this.boat.x += (dx / len) * sp;
      this.boat.y += (dy / len) * sp;
      this.boatSprite?.setFlipX(dx < 0);
      this.boat.setAngle(Phaser.Math.Linear(this.boat.angle, dx * 6, 0.2));
    } else {
      this.boat.setAngle(Phaser.Math.Linear(this.boat.angle, 0, 0.1));
    }
    // 边界
    this.boat.x = Phaser.Math.Clamp(this.boat.x, 30, W - 30);
    this.boat.y = Phaser.Math.Clamp(this.boat.y, 40, H - 40);

    // 海波流动
    this.updateWaves(time);
    // 船浪花
    if (dx || dy) this.spray(this.boat.x, this.boat.y);
  }

  private makeSea() {
    // 深蓝渐变底部（整屏是海）
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a2a4a, 0x0a2a4a, 0x0f4a7a, 0x0f4a7a, 1);
    g.fillRect(0, 0, W, H);
    // 波浪横线（俯视海面的涌动）
    for (let i = 0; i < 14; i++) {
      const y = 30 + i * 42;
      const w = 90 + (i % 3) * 40;
      const sp = 0.6 + (i % 4) * 0.15;
      this.waves.push({ x: 0, y, w, sp });
    }
  }

  private updateWaves(time: number) {
    this.drawWavesPersistent(time);
  }

  private drawWavesPersistent(time: number) {
    if (!this["waveGfx"]) {
      this["waveGfx"] = this.add.graphics().setDepth(1);
    }
    const gfx = this["waveGfx"] as Phaser.GameObjects.Graphics;
    gfx.clear();
    gfx.lineStyle(2, 0xbfe0f0, 0.35);
    for (const wave of this.waves) {
      const base = wave.y;
      for (let span = 0; span < 5; span++) {
        const x0 = ((span * 220 - time * wave.sp * 0.02) % (W + 400)) - 200;
        gfx.beginPath();
        gfx.moveTo(x0, base);
        gfx.lineTo(x0 + wave.w * 0.8, base + Math.sin(time * 0.004 + x0 * 0.01) * 2);
        gfx.strokePath();
      }
    }
  }

  private spray(x: number, y: number) {
    const p = this.add.circle(x + Phaser.Math.Between(-14, 14), y + 12, 2, 0xcfefff, 0.8);
    this.tweens.add({
      targets: p,
      scale: { from: 1, to: 0.2 },
      alpha: { from: 0.8, to: 0 },
      duration: 500,
      onComplete: () => p.destroy(),
    });
  }

  private makeBoatTexture() {
    const txt = this.textures.createCanvas("boat", 60, 44);
    const g = txt.getContext();
    g.fillStyle = "#5a401c";
    g.fillRect(6, 20, 48, 14); // 船体
    g.fillStyle = "#6b4a22";
    g.fillRect(0, 18, 60, 10); // 甲板
    g.fillStyle = "#e8e0d0";
    g.fillRect(26, 2, 10, 18); // 主帆
    g.fillStyle = "#c8d8e8";
    g.fillRect(42, 4, 8, 14); // 前帆
    g.fillStyle = "#3a2c18";
    g.beginPath();
    g.moveTo(20, 2);
    g.lineTo(50, 2);
    g.lineTo(50, 8);
    g.closePath();
    g.fill(); // 帆桁
    txt.refresh();
  }
}

// 模式B · 侧面海发射场景
class FireScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Image;
  private hullSpray!: Phaser.GameObjects.Ellipse;
  private aimLine!: Phaser.GameObjects.Graphics;
  private angle = 0;
  private hint!: Phaser.GameObjects.Text;
  private target!: Phaser.GameObjects.Image;
  private save = new Save(undefined, "saga2d.verify");

  constructor() {
    super("fire");
  }

  create() {
    this.makeFireSea(); // 侧面海（整屏是海，地平线上方留天空）
    this.makeFireShipTexture();
    this.makeBallTexture();
    this.makeTargetTexture();

    const seaY = H - 120; // 海平面
    this.ship = this.add.image(W * 0.22, seaY + 6, "fireship");
    this.hullSpray = this.add.ellipse(W * 0.22 - 40, seaY + 18, 46, 8, 0xcfefff, 0.5);

    // 目标：一叶小船（自动左右漂，供瞄准）
    this.target = this.add.image(W * 0.8, seaY + 6, "targetBoat");
    this.tweens.add({
      targets: this.target,
      x: W * 0.7,
      yoyo: true,
      repeat: -1,
      duration: 2600,
      ease: "Sine.inOut",
    });

    this.aimLine = this.add.graphics().setDepth(9);
    this.angle = 0;

    // 键盘
    this.input.keyboard!.on("keydown-UP", () => (this.angle = Math.min(80, this.angle + 4)));
    this.input.keyboard!.on("keydown-DOWN", () => (this.angle = Math.max(0, this.angle - 4)));
    this.input.keyboard!.on("keydown-SPACE", () => this.fire());
    this.input.keyboard!.on("keydown-ENTER", () => this.fire());
    this.input.keyboard!.on("keydown-ESC", () => this.scene.start("sail"));
    this.input.keyboard!.on("keydown-BACKSPACE", () => this.scene.start("sail"));

    // 提示
    this.hint = this.add
      .text(
        W / 2,
        H - 22,
        "↑/↓ 调整炮口角度 · 空格发射 · BACKSPACE 返回航行",
        { fontSize: "13px", color: "#eaf6ff" }
      )
      .setOrigin(0.5);
    this.add
      .text(14, 14, "发射模式 · 侧面海 · 完整抛物线", { fontSize: "15px", color: "#ffd9a0" })
      .setDepth(20);
  }

  update(time: number) {
    // 画炮管与瞄准线（侧面海，从船右侧发射，明显抛物弧线）
    const seaY = H - 120;
    const muzz = { x: this.ship.x + 34, y: this.ship.y - 6 };
    const rad = Phaser.Math.DegToRad(this.angle);
    this.aimLine.clear();
    // 炮管
    this.aimLine.lineStyle(6, 0x222222, 0.9);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.ship.x - 6, this.ship.y - 6);
    this.aimLine.lineTo(
      this.ship.x + 34,
      this.ship.y - 6 - Math.sin(rad) * 26
    );
    this.aimLine.strokePath();
    // 瞄准虚线（只画角度方向的辅助线）
    this.aimLine.lineStyle(2, 0xffd9a0, 0.4);
    this.aimLine.beginPath();
    this.aimLine.moveTo(muzz.x, muzz.y);
    this.aimLine.lineTo(muzz.x + Math.cos(rad) * 140, muzz.y - Math.sin(rad) * 140);
    this.aimLine.strokePath();
  }

  private fire() {
    const seaY = H - 120;
    const muzz = { x: this.ship.x + 34, y: this.ship.y - 6 };
    const rad = Phaser.Math.DegToRad(this.angle);
    // 用显式抛体运动画抛物线（可调角度，弧线清晰可控）
    const ball = this.add.image(muzz.x, muzz.y, "ball").setDepth(5);
    const v = 9.5; // 初速度（像素/帧，调小让弧线明显）
    const vx = Math.cos(rad) * v;
    const vy = Math.sin(rad) * v;
    const g = 0.24; // 重力（像素/帧²）
    let t = 0;
    const step = () => {
      if (!ball.active) return;
      t += 1;
      ball.x = muzz.x + vx * t;
      ball.y = muzz.y - vy * t + 0.5 * g * t * t;
      // 超出边界
      if (ball.x > W + 30 || ball.x < -30 || ball.y > H + 40) {
        ball.destroy();
        return;
      }
      // 命中目标小船
      if (Phaser.Math.Distance.Between(ball.x, ball.y, this.target.x, this.target.y) < 24) {
        this.registerHit(ball.x, ball.y);
        ball.destroy();
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private registerHit(x: number, y: number) {
    // 命中特效：一段水花
    for (let i = 0; i < 6; i++) {
      const p = this.add.circle(x + Phaser.Math.Between(-8, 8), y + Phaser.Math.Between(0, 6), 2, 0xbfe8ff, 0.8);
      this.tweens.add({ targets: p, y: p.y + 20, alpha: 0, duration: 500, onComplete: () => p.destroy() });
    }
    const hit = this.save.get<number>("hits") ?? 0;
    this.save.set("hits", hit + 1);
    this.save.persist();
    this.add
      .text(x, y - 20, "命中!", { fontSize: "16px", color: "#ffd9a0" })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private makeTargetTexture() {
    const txt = this.textures.createCanvas("targetBoat", 40, 26);
    const g = txt.getContext();
    g.fillStyle = "#8a5a2a";
    g.fillRect(2, 10, 36, 10);
    g.fillStyle = "#e8e0d0";
    g.fillRect(14, 0, 8, 10);
    txt.refresh();
  }

  private makeFireSea() {
    // 天 + 海（海占大部分，地平线偏上）
    const g = this.add.graphics().setDepth(-10);
    g.fillGradientStyle(0x1a3a5a, 0x3a6a9a, 0x0a2a4a, 0x0a2a4a);
    g.fillRect(0, 0, W, H); // 全海
    // 海平面高光
    const seaY = H - 120;
    g.fillGradientStyle(0x7fb8d8, 0x7fb8d8, 0x0a3a6a, 0x0a3a6a);
    g.fillRect(0, seaY, W, H - seaY);
    // 地平线
    g.fillStyle(0xcfe6f0, 1);
    g.fillRect(0, seaY, W, 2);
  }

  private makeFireShipTexture() {
    const txt = this.textures.createCanvas("fireship", 80, 40);
    const g = txt.getContext();
    g.fillStyle = "#5a401c";
    g.fillRect(4, 14, 72, 16); // 船体
    g.fillStyle = "#6b4a22";
    g.fillRect(0, 12, 80, 8);
    g.fillStyle = "#e8e0d0";
    g.fillRect(22, 0, 12, 14); // 主帆(竖)
    g.fillStyle = "#c8d8e8";
    g.fillRect(40, 2, 8, 12);
    txt.refresh();
  }

  private makeBallTexture() {
    const txt = this.textures.createCanvas("ball", 14, 14);
    const g = txt.getContext();
    g.fillStyle = "#ffd9a0";
    g.beginPath();
    g.arc(7, 7, 6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#8a5a2a";
    g.beginPath();
    g.arc(5, 5, 2, 0, Math.PI * 2);
    g.fill();
    txt.refresh();
  }
}

// 用 Saga2D core 引擎启动（作为引擎链证明）
class BootScene extends Scene {
  key = "boot";
  create(ctx: SceneContext) {
    ctx.bus.emit("game:start", { message: "Saga2D 双模式海战最小演示启动" });
  }
  update(_ctx: SceneContext) {}
  destroy(ctx: SceneContext) {
    ctx.bus.clear();
  }
}

function bootCore() {
  const engine = new Engine({ initial: new BootScene(), fixedStep: 1 / 60 });
  engine.bus.on("game:start", (p) =>
    console.log("Saga2D core:", (p as { message: string }).message)
  );
  engine.start();
  return engine;
}

// 初始化 Phaser（含 sail + fire 两个场景）
const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: W,
  height: H,
  backgroundColor: "#0a2a4a",
  physics: {
    default: "matter",
    matter: { gravity: { x: 0, y: 0.5 }, debug: false },
  },
  scene: [SailScene, FireScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});

const coreEngine = bootCore();

declare global {
  interface Window {
    __saga2d?: { phaser: Phaser.Game; core: ReturnType<typeof bootCore> };
  }
}
window.__saga2d = { phaser, core: coreEngine };
