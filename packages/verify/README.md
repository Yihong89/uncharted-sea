# @saga2d/verify — 双模式海战最小 demo（M1）

验证 Saga2D 引擎"最小链"能跑：**Phaser 渲染 + matter 物理 + Saga2D core 引擎集成 + 可构建静态产物**。

## 运行

```bash
pnpm install
pnpm dev         # 本地开发，浏览器打开 Vite 提示的地址
pnpm build       # 产出 dist/（可直接部署 GitHub Pages）
```

## 玩法（双模式）

- **模式A · 航行**（俯视海面）：`W/A/S/D` 让船在整屏海面上自由上下左右移动。
- **模式B · 发射**（侧面海）：按 `空格` 或 `Enter` 进入侧面海视角；
  `↑/↓` 调整炮口角度，`空格` 发射炮弹——炮弹划出**明显的抛物线弧线**（先升后降），命中移动的目标小船会显示"命中!"并写入 localStorage。
  `BACKSPACE` 或 `ESC` 返回航行模式。

## 引擎集成点

- 用 `@saga2d/core` 的 `Engine`/`Scene`/`EventBus`/`Save` 启动并跑核心链路。
- 渲染/物理用 Phaser（matter）。未来由 Saga2D 的 `ActionLayer` 包装成 `getBody/applyImpulse` 等接口。
- 本 demo 是纯静态、可构建、可部署（无后端、无外部资源，全部程序化贴图）。

## 说明

`dist/` 是构建产物，可用任意静态服务器（`python -m http.server`）或直接部署到 GitHub Pages 查看。
