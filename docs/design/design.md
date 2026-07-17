# LUMEN 流明 · 虚拟美术馆 — 全局设计文档

> 可复用的浏览器端 3D 虚拟展览馆模板 · React Three Fiber · 数据驱动换展
> 适用范围：作品集展示 / 品牌宣传 / 艺术展览 / 博物馆 / 数字展厅

---

## 1. 项目概述

**LUMEN 流明**是一个"一次搭建、无限换展"的 3D 虚拟美术馆模板。全部展品（图片 / 文字 / 视频 / 3D 模型 / 外部链接）由一份 `exhibits.json` 配置驱动；替换配置文件与素材目录，即可在几分钟内生成一座全新的展厅，而无需改动任何代码。

**核心体验**：访客以一名低多边形人物角色进入一座现代数字美术馆，自由行走、探索四个展区，靠近展品时射灯增亮、地面浮现铜色光环，按 `E` 或点击即可打开博物馆标签式的展品详情，并支持高清大图放大浏览。

**单页沉浸式应用**，由三个视图层构成（详见 §12 页面列表）：
1. 加载 / 入场覆盖层（Loading & Entry Overlay）
2. 3D 画廊场景 + HUD（探索主视图）
3. 展品详情弹窗 + 图片灯箱（Exhibit Modal & Lightbox）

---

## 2. 设计原则

| 原则 | 说明 |
|---|---|
| **美术馆质感** | 暖白灰泥墙、浅色橡木与混凝土、3000K 轨道射灯、柔和阴影。低饱和暖中性色，**禁止蓝紫渐变**。UI 如博物馆导览册般克制优雅。 |
| **数据驱动** | 展品、展区、文案、出生点全部来自 JSON。代码零硬编码内容。 |
| **操作直觉** | 桌面端 WASD + 鼠标即上手；移动端虚拟摇杆 + 拖拽视角；所有操作在帮助面板与 HUD 中可见。 |
| **性能优先** | 射灯按需激活、阴影预算严格、纹理压缩、移动端自动降级。目标：中端 PC 60fps / 移动端 30fps+。 |
| **组件可复用** | 展陈构件（画框 / 展台 / 展柜 / 屏幕 / 面板）、相机、控制器、UI 均为独立组件，可单独抽离复用。 |

---

## 3. 视觉方向

**情绪关键词**：安静、通透、暖白、秩序感、被光照亮的艺术品。

**空间参照**：当代美术馆白盒子空间（White Cube）+ 日式美术馆的暖木质感。大面积留白墙面，深色轨道与射灯形成工业细节，黄铜色作为唯一的"奢华"点缀。

**画面基调**：ACES Filmic 色调映射，轻微暖色倾向；远距离轻微雾化（暖白雾）营造空气纵深；屏幕外缘叠一层极轻 CSS 暗角，视觉聚焦画面中心。

---

## 4. 色彩系统

### 4.1 UI / 品牌色板（CSS Custom Properties）

| Token | 值 | 用途 |
|---|---|---|
| `--paper` | `#F4F1EA` | UI 主背景 / 加载页 / 卡片。画廊墙面同色 |
| `--paper-dim` | `#E9E4D8` | 次级背景 / 标签底 / 悬停态 |
| `--ink` | `#221F1A` | 主文字 / 深色 UI / 轨道与画框黑 |
| `--ink-60` | `rgba(34,31,26,.60)` | 次级文字 |
| `--ink-38` | `rgba(34,31,26,.38)` | 辅助文字 / 图标 |
| `--stone` | `#8A8375` | 说明文字 / 博物馆标签次级信息 |
| `--brass` | `#A67C3D` | **唯一强调色**：按钮、焦点光环、交互高亮、链接 |
| `--brass-bright` | `#C89B5A` | 强调色悬停态 / 高亮描边 |
| `--brass-wash` | `rgba(166,124,61,.12)` | 强调色浅底（chip、地图激活区） |
| `--night` | `#14120F` | 灯箱背景 / 深色覆盖层 |
| `--line` | `rgba(34,31,26,.12)` | 分隔线 / 卡片描边 |
| `--ok` | `#5F7A54` | 成功提示（极少用） |

**用色规则**：
- 全站**无蓝紫渐变、无霓虹色**。渐变仅允许同色系暖白→暖灰的微弱过渡。
- `--brass` 只用于"可交互"与"被聚焦"语义，不大面积铺色。
- 覆盖在 3D 场景上的 UI 使用 `--paper` 92% 不透明度 + `backdrop-blur(12px)`，保持空间通透感。

### 4.2 3D 场景材质色板

| 材质 | 颜色 / 参数 | 说明 |
|---|---|---|
| 墙面灰泥 | `#F1EDE3`，roughness .92 | 细颗粒灰泥纹理（见资源清单） |
| 踢脚线 / 门框 | `#2A2723`，roughness .5 | 深炭黑，8cm 高踢脚线 |
| 主厅地面 | `#B9B0A0`，roughness .35 | 抛光暖灰混凝土，弱反射 |
| 侧厅地面 | `#B39772`，roughness .55 | 浅色橡木直拼板 |
| 展台 / 展柜座 | `#F1EDE3` 同墙 | 白色立方展台，融入墙面 |
| 展柜玻璃 | 透明，roughness .05，opacity .14 | 弱反射，边缘高光 |
| 轨道 / 射灯外壳 | `#1D1B18` 哑光黑 | 工业细节 |
| 画框-黑 | `#211E19` 细边 4cm | 版画 / 现代作品 |
| 画框-橡木 | `#9A7B54` 4cm | 风景 / 印象派 |
| 画框-鎏金 | `#8F6F35` 宽边 8cm，微金属感 | 古典油画 |
| 角色 | `#B9B2A4` 哑光陶瓷 + 黄铜颈环 `#A67C3D` | 无面美术馆人台 |
| 雾 / 天空 | `#F4F1EA` | 与墙面同色，空间"无尽白" |

---

## 5. 字体系统

| 角色 | 字体族 | 字重 | 说明 |
|---|---|---|---|
| 展示衬线 Display | `Fraunces`（拉丁）→ `Noto Serif SC`（中文回退） | 400 / 500 / 600 | 展览标题、展品名、展区名。`font-feature-settings: "ss01"`，优雅旧式感 |
| 界面无衬线 UI | `Manrope`（拉丁）→ `Noto Sans SC` | 400 / 500 / 600 / 700 | 正文、按钮、说明、HUD |
| 等宽 Mono | `IBM Plex Mono` | 400 / 500 | 展品编号、进度百分比、键帽、坐标 |

### 字阶（rem 基准 16px）

| Token | 规格 | 用途 |
|---|---|---|
| `t-display` | 40px / 1.15 / serif 500 / ls .01em | 加载页展览标题 |
| `t-title` | 26px / 1.25 / serif 500 | 弹窗展品名 |
| `t-zone` | 20px / 1.3 / serif 500 | HUD 当前展区名 |
| `t-label` | 15px / 1.75 / sans 400 | 正文 / 简介 |
| `t-ui` | 14px / 1.5 / sans 500 | 按钮 / chip |
| `t-caption` | 12.5px / 1.6 / sans 400 / `--stone` | 标签次级信息 / 图注 |
| `t-mono` | 11px / 1.4 / mono 500 / ls .14em / 大写 | 编号「P-01」/ 键帽 / 百分比 |

中文正文行高不小于 1.7；展览相关中文标题用 Noto Serif SC，与 Fraunces 混排时基线微调 `-0.02em`。

---

## 6. 间距 · 圆角 · 阴影 · 线条

- **间距**：4px 基准 —— `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`
- **圆角**：卡片 `14px`；按钮 / 输入 `10px`；chip / 键帽 `999px`；灯箱 `0`（全屏）
- **描边**：一律 1px `--line`；强调态 1px `--brass`
- **阴影**（暖色调，禁冷灰）：
  - 卡片浮起：`0 24px 60px -24px rgba(34,31,26,.35)`
  - chip / HUD 元件：`0 8px 24px -10px rgba(34,31,26,.28)`
  - 弹窗抽屉：`0 0 0 1px rgba(34,31,26,.06), -24px 0 80px -32px rgba(20,18,15,.45)`

---

## 7. 动效语言

**节奏**：博物馆式的从容 —— 缓入快定，无弹跳滥用。

| 场景 | 参数 |
|---|---|
| UI 淡入 / 位移 | `0.45s cubic-bezier(.22,1,.36,1)`，位移量 12–24px |
| 抽屉 / 底部弹层 | Framer Motion spring `stiffness 260, damping 30` |
| chip / 按钮微交互 | `0.18s ease-out`，scale 1→1.04 |
| 展品聚焦（3D） | 射灯强度 300ms 线性插值；地环淡入 300ms 后 1.6s 呼吸脉冲（scale 1↔1.045，opacity .5↔.9） |
| 相机运动 | 每帧 lerp 系数 .08（阻尼跟随）；模式切换 0.6s `easeInOutCubic`；聚焦运镜 0.8s `easeInOutCubic` |
| 区域切换标签 | 旧名 y -8px 淡出 .25s → 新名 y +8px 淡入 .4s |
| 加载进度条 | 宽度随真实进度 .3s ease-out；数字 mono 滚动 |
| 文本动画 | 仅标题级：字符级 stagger .03s（≤20 字符）；正文一律整块淡入 |

**滚动行为**：本应用无页面滚动（Canvas 全屏）；弹窗内长文用原生滚动 + 细滚动条（`scrollbar-width: thin`，滑块 `--line`）。

---

## 8. 光标样式

- 场景默认：`default`；悬停展品：`pointer`；拖拽视角中：`grabbing`
- 第一人称指针锁定后：隐藏系统光标，画面中心显示 **6px 黄铜色圆点准星**（`--brass`，外圈 1px 白描边保证亮墙上可见），悬停到可交互展品时准星放大至 10px 并变为圆环
- 所有 UI 覆盖层恢复正常系统光标

---

## 9. 音效（可选，默认关闭）

- 首版不含背景音；视频展品在场景内静音循环，弹窗内可开声播放。
- 交互音效预留接口（聚焦 / 打开 / 关闭 三枚轻量采样），默认静音，由配置 `gallery.sound: false` 控制。

---

## 10. 技术栈与依赖

| 依赖 | 版本 | 用途 |
|---|---|---|
| Vite + React + TypeScript | Vite 7 · React 19 | 工程基座 |
| `three` | ≥0.170 | 3D 渲染核心 |
| `@react-three/fiber` | ^9 | React 渲染器 |
| `@react-three/drei` | ^10 | Environment/Lightformer、useGLTF、Html（备用）、软影工具 |
| `zustand` | ^5 | 全局状态机（加载/探索/弹窗/灯箱/视角模式/当前展区） |
| `framer-motion` | ^12 | 全部 UI 覆盖层动效 |
| `tailwindcss` | 3.4 | UI 样式（色板映射到 §4.1 tokens） |
| `lucide-react` | latest | HUD 图标（帮助/视角/全屏/关闭/外链/缩放） |

不引入 GSAP / Lenis（无滚动叙事需求）；后处理仅 CSS 暗角，不引入 postprocessing 链以保帧率。

---

## 11. 项目目录结构（模板交付形态）

```
/public
  /data
    exhibits.json          # ★ 换展只需改这里（+素材目录）
  /assets
    /artworks/             # 展品图片 jpg（≤1600px 长边）
    /videos/               # 展品视频 mp4 + poster.jpg
    /models/               # 展品 3D 模型 glb（Draco，≤2MB）
    /textures/             # 地板/灰泥等 PBR 纹理（CC0）
/src
  /config
    schema.ts              # 展品数据 TS 类型 + zod 校验（见 §13）
    site.ts                # 全局常量（速度、相机、灯光预算）
  /state
    store.ts               # zustand 状态机
  /scene
    Gallery.tsx            # 场景根：Canvas、色调映射、雾、Suspense
    /architecture          # Walls / Floor / Ceiling / TrackRails / Skylight / TitleWall
    /exhibits              # ExhibitRoot（读配置分发）→ WallFrame / Pedestal / Vitrine / Screen / Panel + MuseumLabel
    /lighting              # GalleryLighting / ExhibitSpot（按需激活）
    Avatar.tsx             # 角色（程序化人台 + 程序化步态）
    /cameras               # ThirdPersonRig / FirstPersonRig / IntroDolly
    FocusRing.tsx          # 聚焦地环 / 描边高亮
  /systems
    /controls              # useKeyboard / PointerLook / VirtualJoystick / usePinchZoom
    collision.ts           # 胶囊 vs AABB/圆柱
    zones.ts               # 区域判定（与 minimap 共用数据）
    interaction.ts         # 最近展品聚焦 + 射线点击
  /ui
    LoadingOverlay.tsx     # 视图 1
    HUD.tsx                # 视图 2 的 DOM 层（组装以下组件）
    Minimap.tsx            # SVG 平面图 + 玩家点
    ZoneLabel.tsx / HintChip.tsx / TopBar.tsx / ControlHints.tsx
    HelpPanel.tsx
    MobileControls.tsx     # 摇杆 / 动作键
    ExhibitModal.tsx       # 视图 3a
    Lightbox.tsx           # 视图 3b
  /hooks /utils
  App.tsx / main.tsx / index.css
```

---

## 12. 页面（视图）列表

| # | 视图 | 设计文件 | 一句话描述 |
|---|---|---|---|
| 1 | 加载 / 入场覆盖层 | `overlay.md` §2–3 | 暖白美术馆门厅式加载页：字标、真实进度条、布展小贴士、「进入展厅」按钮与入场运镜衔接 |
| 2 | 3D 画廊场景 + HUD | `gallery.md`（场景）+ `overlay.md` §4–8（HUD） | 主视图：四展区 3D 空间、角色漫游、聚焦交互；HUD 含字标/展区名、小地图、视角切换、帮助、操作提示、聚焦提示 chip |
| 3 | 展品详情弹窗 + 图片灯箱 | `overlay.md` §9–10 | 博物馆标签式详情抽屉（桌面右栏 / 移动底部弹层）+ 全屏深色高清图放大浏览 |

---

## 13. 展品数据契约（exhibits.json Schema）★

**这是模板复用的核心合同**，实现与后续换展都以此为准。

```jsonc
// /public/data/exhibits.json
{
  "gallery": {
    "title": "经典的回响",
    "titleEn": "Echoes of the Masters",
    "subtitle": "公共领域艺术数字展",
    "preface": "本展汇集已进入公共领域的艺术杰作……（展示于序厅前言面板）",
    "sound": false,
    "spawn": { "position": [0, 0, 5.2], "headingDeg": 180 },  // 出生点与朝向（0=面向+Z）
    "accent": "#A67C3D"                                        // 可换主题强调色
  },
  "zones": [
    // bounds = [minX, minZ, maxX, maxZ]，与小地图、碰撞共用
    { "id": "hall",      "name": "序厅 · 中央大厅", "nameEn": "Central Hall",   "bounds": [-12, -7, 12, 7] },
    { "id": "painting",  "name": "西翼 · 绘画长廊", "nameEn": "Painting Wing",  "bounds": [-28, -5, -12, 5] },
    { "id": "sculpture", "name": "东翼 · 雕塑与器物厅", "nameEn": "Sculpture Wing", "bounds": [12, -5, 28, 5] },
    { "id": "media",     "name": "影像与文献厅",   "nameEn": "Media Room",     "bounds": [-7, -17, 7, -7] }
  ],
  "exhibits": [ /* Exhibit[]，见下 */ ]
}
```

```ts
// /src/config/schema.ts — Exhibit 类型合同
type ExhibitType = 'image' | 'video' | 'model' | 'text' | 'link';
type MountType   = 'wall-frame' | 'pedestal' | 'vitrine' | 'screen' | 'panel';

interface Exhibit {
  id: string;                       // 唯一编号，建议「区-序号」如 "P-01"
  type: ExhibitType;                // 内容类型
  zone: string;                     // 所属 zones[].id
  mount: MountType;                 // 展陈方式（决定 3D 构件）
  title: string;                    // 作品名（中文）
  titleEn?: string;
  artist?: string;                  // 作者
  year?: string;                    // 年代
  medium?: string;                  // 媒材，如「布面油画」
  credit?: string;                  // 来源 / 收藏机构 / 许可说明
  description: string;              // 简介（弹窗正文，≤300字）
  src?: string;                     // 媒体路径：/assets/artworks/x.jpg | videos/x.mp4 | models/x.glb
  poster?: string;                  // 视频海报帧
  link?: string;                    // type=link 的目标 URL；其他类型可作「查看来源」
  position: [number, number, number]; // 世界坐标（米）；墙面件为画面中心，座地件为底座中心 y=0
  rotationDeg?: number;             // 绕 Y 轴朝向，0 = 面向 +Z；默认 0
  size?: { w: number; h: number };  // 展品物理尺寸（米），画芯/屏幕/面板
  frame?: 'oak' | 'black' | 'gilt' | 'none';  // wall-frame 专用
  focusRadius?: number;             // 聚焦触发半径，默认 2.6m
  spotlight?: boolean;              // 是否配轨道射灯，默认 true
  modelScale?: number;              // glb 缩放，默认 1
  spin?: boolean;                   // pedestal 展品缓速自转（0.15 rad/s）
}
```

**类型 × 展陈方式 对照**（实现侧的分发规则）：

| type | 推荐 mount | 场景内呈现 | 弹窗呈现 |
|---|---|---|---|
| `image` | wall-frame / vitrine | 带框挂画 / 展柜内立牌 | 高清图 +「放大浏览」进灯箱 |
| `text` | panel | 墙面亚克力面板（前言等） | 纯文排版 |
| `video` | screen | 16:9 壁挂屏静音循环 | 弹窗内可开声播放 |
| `model` | pedestal | 展台 glb 模型缓速自转；无 src 时程序化占位雕塑 | 简介 + 提示「请至展台环绕观看」 |
| `link` | panel | 带外链图标的黄铜描边面板 | 摘要 +「前往访问 ↗」按钮 |

**校验规则**：进入场景前用 zod 校验；`position` 越界 / `zone` 不存在 / 五元类型不符时在控制台给出中文警告并跳过该展品，不阻断整个展览。

---

## 14. 资源清单（Asset Manifest）

> 设计侧仅定义清单；素材获取 / 生成由实现团队完成。展品图均为**公共领域 / CC0 开放馆藏**，从来源页下载并保留许可记录于 `ASSETS-LICENSE.md`。

### 14.1 品牌与 UI 素材

| 文件 | 描述 | 位置 | 尺寸 | 类型 |
|---|---|---|---|---|
| `logo.svg` | LUMEN 字标图形：一个圆角拱形门洞轮廓（1.5px 线），门洞内一道垂直光束矩形；单色 `--ink`，可反白 | 加载页 / HUD / 帮助面板 | 48×48 viewBox | SVG |
| 图标组 | 不产出文件，统一使用 `lucide-react`：`HelpCircle` `PersonStanding` `Eye` `Maximize` `X` `ExternalLink` `ZoomIn` `Move` `MousePointer` | HUD / 弹窗 | 20px 线宽 1.5 | — |

### 14.2 场景纹理素材（CC0，ambientCG / Poly Haven 同级）

| 文件 | 描述 | 位置 | 尺寸 | 类型 |
|---|---|---|---|---|
| `floor-concrete.jpg` | 抛光暖灰混凝土，细腻磨石颗粒，极弱斑驳，暖中性偏米，无明显接缝 | 主厅地面（2m 平铺） | 1024×1024 1:1 | Image |
| `floor-oak.jpg` | 浅橡木直拼地板，哑光、浅棕米色、直纹细腻，板宽 12cm 错缝 | 侧厅地面（2m 平铺） | 1024×1024 1:1 | Image |
| `wall-plaster.jpg` | 美术馆暖白灰泥墙，极细砂粒质感，近乎纯色，弱凹凸 | 全部墙面（1.5m 平铺，法线可选） | 1024×1024 1:1 | Image |
| `shadow-blob.png` | 径向渐变软圆黑斑（中心 rgba(0,0,0,.35)→0） | 角色 / 展台假投影 | 256×256 1:1 | Image |

### 14.3 演示展品素材（公共领域）

**绘画（`type: image`，存 `/assets/artworks/`，长边 ≤1600px JPG）**——来源：大都会艺术博物馆 Open Access、芝加哥艺术博物馆（Artic CC0）、Wikimedia Commons：

| 文件 | 作品 | 描述要点（供检索/核对） |
|---|---|---|
| `vangogh-selfportrait.jpg` | 梵高《戴草帽的自画像》1887（Met） | 蓝绿背景、草帽、厚涂笔触，竖幅 |
| `hokusai-wave.jpg` | 葛饰北斋《神奈川冲浪里》c.1831（Met） | 巨浪、富士山、普鲁士蓝，横幅版画 |
| `vermeer-pitcher.jpg` | 维米尔《持水壶的年轻女子》c.1662（Met） | 窗边女子、银水壶、柔光，竖幅 |
| `monet-lilies.jpg` | 莫奈《睡莲池上的桥》1899（Met） | 日本桥、垂柳、睡莲，近方形 |
| `degas-dance.jpg` | 德加《舞蹈课》1874（Met） | 排练厅、芭蕾舞者、斜构图 |
| `cassatt-bath.jpg` | 卡萨特《孩童沐浴》1893（AIC CC0） | 母与子、洗脚场景、版画式线条，竖幅 |
| `seurat-grande-jatte.jpg` | 修拉《大碗岛的星期天下午》1884-86（AIC CC0） | 点彩、河畔人群，大横幅 |
| `leutze-washington.jpg` | 洛伊茨《华盛顿横渡特拉华河》1851（Met） | 冰河渡船、星条旗，大横幅 |
| `vangogh-cypresses.jpg` | 梵高《麦田与柏树》1889（Met） | 旋涡天空、柏树、金黄麦田 |
| `qing-vase.jpg` | 中国青花梅瓶（Met 藏品照） | 白底产品照、青花纹样，竖幅（展柜立牌用） |
| `greek-amphora.jpg` | 古希腊黑绘双耳陶瓶（Met 藏品照） | 黑绘人物、陶土橙底，竖幅（展柜立牌用） |

**3D 模型（`type: model`，存 `/assets/models/`，Draco 压缩 glb ≤2MB）**——来源：Scan the World / threedscans 等 CC0 雕塑扫描；**若获取失败，实现侧用程序化几何回退**（见 `gallery.md` §7）：

| 文件 | 内容 | 描述 |
|---|---|---|
| `venus.glb` | 米洛的维纳斯 全身像 | 白大理石质感，序厅中央主展 |
| `david-head.glb` | 米开朗基罗《大卫》头像 | 雕塑厅展台 |
| `thinker.glb` | 罗丹《思想者》 | 雕塑厅展台 |
| `discobolus.glb` | 《掷铁饼者》 | 雕塑厅展台 |

**视频（`type: video`，存 `/assets/videos/`）**：

| 文件 | 内容 | 描述 |
|---|---|---|
| `bbb.mp4` + `bbb-poster.jpg` | 《Big Buck Bunny》© Blender Foundation，CC-BY 3.0 | 1080p ≤30MB 剪辑版，开源电影作动态影像演示；海报帧为林间兔子 |

---

## 15. 性能预算与守卫

| 项 | 预算 |
|---|---|
| 同屏阴影光源 | 平行光 1（2048 PCFSoft）+ 主厅重点射灯 ≤3（512）；其余射灯不投影 |
| 射灯激活数 | 同时激活 ≤8：常亮主灯 2 + 距玩家最近 6 个展品灯；移动端 ≤5 |
| 纹理 | 单张 ≤1600px；`anisotropy 4`；全部 mipmap |
| 几何 | 画框 / 展台 / 射灯外壳用 `InstancedMesh` 或共享 geometry；墙面合并 |
| pixelRatio | 桌面 `min(dpr, 2)`；移动端 `min(dpr, 1.5)` |
| 移动端降级 | 关闭射灯阴影、平行光阴影降至 1024、雾密度提高以裁剪远景物、玻璃改不透明磨砂 |
| 帧率目标 | 桌面 60fps / 移动 30fps+；`frameloop="always"`，弹窗打开时 3D 降帧至 30 |

---

## 16. 响应式与移动端策略

- **断点**：`<768px` 为移动端布局（HUD 紧凑化、底部弹层、虚拟摇杆）；`≥768px` 桌面布局
- 桌面：指针锁定 + 拖拽双模视角；移动端：左下动态原点摇杆（移动）+ 右侧 60% 区域拖拽（视角）+ 双指捏合（第三人称呼拉距离）+ 点按展品直接打开
- Canvas 始终 100dvh 全屏；`touch-action: none`；安全区 `env(safe-area-inset-*)` 适配刘海屏
- 竖屏移动端顶部提示「横屏体验更佳」（仅首次，可关闭）

---

## 17. 换展指南（设计侧约定）

更换展览仅需三步，无需改代码：
1. **替换素材**：把新图片 / 视频 / glb 放入 `/public/assets/` 对应目录
2. **改写配置**：编辑 `/public/data/exhibits.json` —— 改 `gallery` 文案与出生点、按需增删 `exhibits`（类型与字段遵循 §13 合同；位置可用「网格速写」：每区墙长与坐标系见 `gallery.md` §2）
3. **刷新即新展**：标题墙、前言面板、小地图区域名、展品详情全部自动更新

展区数量与户型为模板固定几何（主厅 + 两翼 + 影像厅，19 个展陈点位预留）；超出点位的展品会收到控制台中文警告。后续版本可将几何也数据化（v2 路线，不在首版范围）。
