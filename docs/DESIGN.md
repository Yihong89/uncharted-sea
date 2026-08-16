# Saga2D — 引擎设计文档（v0.1 草案）

> 本档是 **Saga2D**（传奇叙事 Saga + 2D）通用 2D HTML5 引擎的**工程蓝图**。
> 读者：未来的协作者、使用引擎做游戏的开发者、以及"造福后人"的维护者。
> 状态：**草案**，随第一个游戏驱动迭代而修订。

---

## 0. 愿景与边界

**愿景**：写一个带"战斗 + 剧情 + 多角色语音"的游戏，应当像填一份声明式配置，而不是把
Phaser、matter-js、ink、TTS 四套东西重新粘一遍。

**边界（重要，防止失控）**：
- Saga2D 是**上层整合引擎**，不重造渲染/物理/叙事/合成这些底层轮子。
- 引擎核心（Core）力求**通用**；动作/剧情/语音是**可插拔上层（Layer）**。
- 一切能力**由真实游戏驱动验证**，杜绝"纯搭框架"。
- 部署目标是 **GitHub Pages 等纯静态托管** → 引擎**不引入任何需要后端的实时云依赖**。

**质量支柱**：稳定 API · 清晰模块 · 可跑 demo · 可讲清的设计文档。

---

## 1. 依赖选型（锁定）

| 层 | 依赖 | 许可证 | 备注 |
|----|------|--------|------|
| 渲染/引擎底座 | **Phaser** | MIT | 动作/场景/精灵/动画/输入全内置 |
| 物理 | **matter-js** | MIT | 2D 刚体物理；Phaser 内置封装，亦可独立用 |
| 叙事脚本 | **ink**（+ **inkjs** 浏览器运行时） | MIT | 分支/变量/事件/段落跳转 |
| 语音合成 | **Qwen3-TTS**（本地，参考音色克隆） | （Qwen 系开放） | 通过自研 VoiceLayer 包一层 |
| 音频播放 | WebAudio + `<audio>` | — | 浏览器原生 |
| 语言/工程 | **TypeScript + pnpm mono-repo** | MIT | 类型安全；分包 core/action/narrative/voice |

> **不选为底层**：任何 DSH 专属库（如 `dsh-voice-core`）。它思路可借鉴、接口不可复用（见 §4.3）。

---

## 2. 架构：Adapter – Core – Layer

```
                ┌──────────────────────────────────────────┐
                │                  Saga2D                  │
                ├──────────────────────────────────────────┤
  可插拔上层     │  ActionLayer   动作/战斗/物理手感         │
  (按游戏按需)   │  NarrativeLayer 剧情/分支/角色/事件(ink)  │
                │  VoiceLayer    多角色TTS/字幕/演出(自研)  │
                ├──────────────────────────────────────────┤
  稳定骨架       │  Core                                       │
  (引擎本体)     │  Scene · ECS · Input · Camera · 事件总线   │
                │  · 时间循环 · 存档 · 资源加载               │
                ├──────────────────────────────────────────┤
  可替换适配层   │  Render=Phaser | Physics=matter-js        │
  (Adapter)     │  Narrative=inkjs | Audio=WebAudio+自研TTS │
                └──────────────────────────────────────────┘
```

**依赖方向**（唯一约束，防腐化关键）：
- `Layer → Core → Adapter`，**单向**。Core 以上看不到具体依赖库。
- 游戏代码只依赖 **Core + 选定 Layer 的公开 API**，绝不直接 `import Phaser`/`matter`/`ink`（除非 Layer 内部）。

---

## 3. 中层 Core（稳定骨架）

Core 是引擎"通用"与"不过度设计"的交点。它不管"你玩的是什么"，只管"游戏是怎么运行起来的"。

### 3.1 时序与循环
- `Engine.start(scenes)` → 固定/可配置时间步（支持时间缩放，做慢镜头）。
- `Scene.lifecycle`：`create / update / render / destroy`（语义对齐 Phaser，便于后人理解）。

### 3.2 实体系统（ECS 风格，轻量）
- `Entity` 是带 id 的容器；`Component` 纯数据；`System` 遍历处理。
- 提供 `query(components[])->entities`。
- **为什么轻量**：我们要通用，但不引入重型 ECS 框架带来的复杂度。多数 2D 游戏用"轻组件 + 方向查询"足够。

### 3.3 事件总线
- `bus.emit(event, payload)` / `bus.on(event, fn)`。
- 游戏层事件与引擎内部事件隔离（前缀约定：`fx:` 引擎/`game:` 游戏/语音 `voice:`）。
- 事件总线是 **NarrativeLayer 与 ActionLayer 协作**（对话中触发战斗、战斗获胜推进剧情）的关键通道。

### 3.4 Camera / 视差
- `Camera` 负责世界↔屏幕变换；视差支持分层卷动（参考已验证的 `bg_offset` 思路）。

### 3.5 存档 / 资源 / i18n
- `Save` 抽象：纯 JSON 快照，可插到 localStorage（静态部署无后端）。
- `Assets`：图片/音频/ink 脚本的加载与引用 key。
- `i18n`：台词文本与角色友好名独立于逻辑，中文优先。

---

## 4. 上层 Layer（可插拔）与自研核心

### 4.1 ActionLayer（动作）
- 薄封装 Phaser 场景/精灵 + matter-js 刚体。
- 对外只暴露：`makeRigidBody(shape)`, `applyImpulse`, `collision(handler)`, `timeScale`。
- 承载回旋镖/投掷/弹弓这类玩法（matter 官方 demo 已验证可行性）。
- **手感参数**（跳跃惯性、硬直、打击帧）作为配置项而非魔法数。

### 4.2 NarrativeLayer（剧情）
- 基于 **ink/inkjs**：它已解决分支/变量/条件/事件触发。
- Saga2D 在这层补：**UI 演出**——打字机、立绘、角色名框、字幕、选项面板。
- 与 ActionLayer 的桥：ink 的 `{{}}`/标签可发 `game:` 事件触发战斗、切场景、加好感。
- （借鉴 ink 官方的 Inky 编辑器生态，剧情作者可视化物件。）

### 4.3 VoiceLayer（语音）★ 自研原创点
> **前提修正**：不直接复用 `dsh-voice-core`（DSH 专属）。但**借鉴其成熟思路**，在游戏引擎内重建一套依赖无关的语音层。

**借鉴自 dsh-voice-core 的思路**：
- **音色目录**：`styles = { onee:{...}, loli:{...} }` 与 `defaultStyle`。
- **顺序播放队列**：fetch WAV → `<audio>`，串行不重叠。
- **先显示文本、再朗读**：贴合"字幕 + 语音"演出。
- **角色→音色绑定**：每个角色固定一个 instruct/参考音频。

**Saga2D VoiceLayer 自己的接口（去 DSH 化）**：
```js
voice.styles.add('loli', { instruct: "…撒娇萝莉音…", refAudio: "assets/ref/loli.wav", lang:'zh' })
voice.roles.bind('npc_mei', 'loli')        // 角色绑定音色
await voice.speak('npc_mei', '你来啦，主人！')  // 读一句(字幕+语音,返回可await)
voice.stop('npc_mei')                      // 打断
voice.onLineStart/onLineEnd                // 演出钩子(口型/字幕闪烁)
```

**语音来源三模（重要，配合部署约束）**：
| 模式 | 何时用 | 说明 |
|------|--------|------|
| `local-stream` | 开发期/局域网内 | 走 Mac mini Qwen 实时（经适配，非硬依赖） |
| `pregen` | 公开部署固定台词 | 播放预生成 audio 文件，零延迟零后端 |
| `browser` | 公开部署动态文本 | 浏览器内置 `speechSynthesis` 兜底 |

> 通过 `voice.mode` 一个开关切换，游戏逻辑不感知。

### 4.4 三层协作示例（证明这套设计成立）
```
玩家进道场 → NarrativeLayer 播引入剧情(ink)
   → ink 触发 game:battle → 切到 ActionLayer 战斗(matter 物理 + 回旋镖)
   → 胜利 → bus 通知 NarrativeLayer → 继续剧情 + 角色语音(voice.speak)
   → 存档(Save 层)
```

---

## 5. 底层 Adapter（可替换，不强绑定）

Core/Layer **只依赖抽象接口**，不依赖具体库：

| 抽象接口 | 当前实现 | 可替换实例 |
|---------|---------|-----------|
| `IRenderer`（draw sprite/render/global alpha/滤镜） | Phaser | PixiJS / 自绘 Canvas |
| `IPhysics`（body/impulse/collision/raycast） | matter-js | planck.js / p2 |
| `INarrative`（choose/var/flag/next） | inkjs | Yarn Spinner runtime |
| `ITTS`（styles/bind/speak/stop/queue/mode） | 自研 VoiceLayer | 任意云端 TTS |

> 某个库万一被弃、体积变大或想换，Adapter 处一换，游戏逻辑不受影响。
> 这是"通用引擎"区别于"整合脚本"的分水岭。

---

## 6. 命名

**已定稿：Saga2D**（「Saga 传奇/长篇叙事 + 2D」）。已评估过并因撞车/缺乏区分度而**否决**：Folklore（npm/GitHub 均有同名）、web-engine（GitHub 2.7 万结果）、saga / fable（npm 被占）。

| 候选 | 结论 |
|------|------|
| **Saga2D** | ✅ 定稿：独特、好记、体现叙事+引擎 |
| inktell | 备选（呼应 ink），未采用 |
| web-engine / Folklore / saga / fable | ❌ 否决（撞车/太泛） |

> 正式发布前对 npm / GitHub org 名做最终查重。

---

## 7. 里程碑（游戏驱动，防失控）

| 里程碑 | 目标 | 交付物 |
|-------|------|--------|
| **M0 · 文档** | 蓝图对齐 | 本档 + README（进行中） |
| **M1 · 最小引擎核** | Phaser+matter+ink 跑通链 | `Core+Minimal`，一个"能跑、能对话、能物理"的 shell demo |
| **M2 · VoiceLayer v1** | 台词→角色→语音 | 字幕+本地语音(开发期)跑通；公开部署降级模式可解释 |
| **M3 · 第一个真实游戏** | 用这套组件做一个小而完整的游戏 | 可玩 demo（即用于持续抽取/验证引擎接口）|
| **M4 · 引擎泛化** | 从 M3 抽取 Layer/Core/Adapter | 通用 API 定稿、examples/ 齐全 |
| **M5 · 开源** | 造福后人 | README/文档/许可/示例/CI 就绪 |

> **黄金规则**：任何"引擎能力"都必须能指出是哪个游戏验证了它；否则不实现。

---

## 8. 目录规划（建议）

```
saga2d/   （或 monorepo 根）
├─ docs/           # 设计文档、决策记录(ADR)
├─ packages/
│  ├─ core/        # 引擎核心(Scene/ECS/Bus/Input/Camera/Save/Assets)
│  ├─ layer-action/  # 动作层
│  ├─ layer-narrative/ # 剧情层(ink)
│  └─ layer-voice/   # 语音层(自研,TTS三模)
│  └─ adapter-*     # Render/Physics 等适配实现
├─ games/          # 用引擎做的游戏(每个一个独立子目录)
│  └─ uncharted-sea/  # 《未知海域》
├─ examples/       # 每个模块的最小可跑示例
└─ README.md
```

---

## 9. 已知决策与未决问题

**已决策**
- 用 Phaser 底座 + matter-js + inkjs，不自造底层。
- VoiceLayer **自研、依赖无关**；`dsh-voice-core` 仅作思路参考。
- 纯静态部署；语音公开部署用 pregen / browser 兜底。
- 引擎名 **Saga2D**；语言 **TypeScript**；工程 **pnpm mono-repo**。
- 第一个游戏：《未知海域 The Uncharted Sea》（航海群像，见 `GAME-01.md`）。

**未决 / 待定**
- 引擎包名由 npm/GitHub org 查重最终锁定。
- 舰炮战手感参数、世界地图形态（瓦片海图 vs 连续）→ M1/M2 实测。
- 完整角色名单与声线映射（定角色版本后补）。
- 是否引入经济系统（贸易/补给）。

---

## 10. 引用与参考

- Phaser — https://phaser.io
- matter-js — https://brm.io/matter-js
- ink / inkjs — https://github.com/inkle/ink
- dsh-voice-core（思路参考，非复用） — 本工作区
- 忍者回旋镖 demo（理念/视觉参考） — 本工作区

---

*每次里程碑完成即更新本档。*
