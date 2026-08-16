# Saga2D — GitHub Pages 部署说明

> 回答的核心问题：**pnpm monorepo + TypeScript + Phaser/matter/ink 的架构，能不能放到 GitHub Pages 上展示？**

## 结论

**能。** 但有个关键前提：GitHub Pages 是**纯静态托管（只有 HTML/JS/CSS）**，
所以你不能把整个 monorepo 的**源码**直接堆上去，而要把**构建产物（`dist/`）**部署上去。

```
monorepo 源码 (pnpm + TS + Phaser/matter/ink)
        │  构建 (Vite/Rollup 打包)
        ▼
 dist/ 产物 (纯 html + 打包后的 single js + assets)   ← 这才是 GitHub Pages 能跑的
```

---

## 为什么不建议"把 node 架构原样放 Pages"

浏览器**不认识** TypeScript 和裸 `import`（尤其 monorepo 里 `@saga2d/*` 这种 workspace 引用），
也不运行 Node。直接把源码或整个 workspace 放 Pages 会 404 / 无法运行。

**正确路径：用打包工具（Vite 最契合 Phaser/Web 生态）把"游戏入口"构建成单一静态站点，发布那个 `dist/`。**

---

## 推荐部署结构（Vite + Pages）

```
saga2d/
├─ packages/
│  ├─ core/            # 引擎核心（编译为库）
│  ├─ layer-action/    # 动作层
│  ├─ narrative/voice/ # …
│  └─ verify/          # ★ 最小验证示例（是"可部署入口"）
└─ games/
   └─ uncharted-sea/   # ★ 最终游戏（自身可构建为 Pages 站点）
```

- **`verify/`**（M1 现在要做的）与 **`games/uncharted-sea`**（后续）都是**独立的 Vite 应用**，
  各自能 `vite build` 出 `dist/`。
- GitHub Pages 用 **`gh-pages` 分支** 或 **GitHub Actions** 把某个 `games/xxx/dist/` 发布为站点。

> 说明：`core` 等引擎包是**库**（被打包进 verify/game），本身不直接"上 Pages"，
> 但 verify/game 构建时会把它一起打进 `dist/`。

---

## M1（最小验证）的可部署性

我们会把 `packages/verify` 做成一个 **Vite 应用**：
- `pnpm dev` → 本地开发（浏览器能看到 Phaser 画布动起来）
- `pnpm build` → 产出 `packages/verify/dist/`
- 该 `dist/` 推 GitHub Pages → 即可在线展示出"引擎最小链能跑"

这样从 M1 起，架构每一步都是"**可构建、可部署、可展示**"的，而不是只能本地看。

---

## 与"本地 TTS / Mac mini"的关系

- **部署版（Pages）**：纯静态 → 无法访问本地 `127.0.0.1` TTS。
  语音在部署版走 **pregen（预生成音频）** 或 **浏览器 TTS 兜底**（见 `DESIGN.md` §4.3）。
- **开发期（本地）**：可连 Mac mini 的 Qwen TTS 实时。
- 部署与开发期语音行为不同，属于**预期设计**，不是 bug。

---

## 具体何时在仓库中启用

暂不在本 monorepo 手动加 `.github/workflows` 部署流水线（等第一个可构建的 verify/game 出来，
再用 GitHub Actions 自动构建并发布）。现阶段先把**构建产物能力**搭对。

*随引擎与游戏演进更新。*
