# overlay.md — 加载覆盖层 · HUD · 展品弹窗与灯箱设计

> 覆盖于 3D 场景之上的 DOM 层（React + Tailwind + Framer Motion）。
> 通用规则：覆盖层 UI 底色为 `--paper` 92% + `backdrop-blur(12px)`；投影、圆角、字阶见 `design.md` §5–6；所有图标用 lucide-react，20px / 线宽 1.5。

---

## 1. 覆盖层架构与状态机

```
z-index:  10 Canvas(3D)
          20 HUD（TopBar / ZoneLabel / Minimap / ControlHints / HintChip / 准星 / MobileControls）
          30 提示层（Esc 提示 / 横屏建议 toast）
          40 HelpPanel（帮助）
          50 ExhibitModal（展品详情）
          60 Lightbox（灯箱）
          70 LoadingOverlay（加载，完成后卸载）
```

**全局状态机（zustand `appState`）**：

```
loading ──资源就绪──▶ ready ──点击「进入展厅」──▶ entering ──运镜完──▶ explore
explore ⇄ help（H）    explore ⇄ modal（E/点击展品）    modal ⇄ lightbox（放大浏览）
modal/lightbox/help ──Esc/关闭──▶ 返回上一层
```

任何非 `explore` 状态：漫游输入挂起、Pointer Lock 退出、3D 降帧 30fps；回退到 `explore` 恢复。

**Animation**：所有状态切换由 framer-motion `AnimatePresence` 接管出场动效；同层互斥，跨层可叠加（如 modal 上再开 lightbox）。

---

## 2. 加载覆盖层 LoadingOverlay（视图 1）

**气质**：像站在美术馆门口看一张布展海报。整页 `--paper` 纯色，无渐变。

**布局（桌面，垂直居中列；移动端同构缩放）**：

| 元素 | 规格 |
|---|---|
| Logo | `logo.svg` 56px，`--ink` |
| 字标 | 「LUMEN 流明」Fraunces + Noto Serif SC 500，28px，ls .24em，大写拉丁 + 中文 |
| 展览标题 | `gallery.title`「经典的回响」`t-display` 40px 衬线 + `titleEn` mono 11px `--stone` 大写 ls .14em |
| 副题 | `gallery.subtitle` `t-caption` `--stone` |
| 黄铜分隔线 | 64×1px `--brass`，上下间距 24 |
| 进度区 | 240×2px 进度条：轨道 `--line`、填充 `--brass`（真实加载进度：JSON + 纹理 + glb 加权）；右侧 mono 11px 百分比 `--stone` |
| 布展小贴士 | `t-caption` `--stone`，每 1.6s 轮换：「正在悬挂画作…」「正在调试射灯…」「正在擦拭展柜玻璃…」「正在摆放导览册…」 |
| 进入按钮 | 100% 后进度区替换为「进入展厅 →」：高 48px、px-32、黄铜描边 1px、`t-ui` 600 `--ink`；hover 填充 `--brass` 文字反白 `--paper`；禁用态（未就绪）38% 透明 |
| 页脚 | 底部 24px：`t-caption` `--stone`「桌面浏览器体验最佳 · 支持触屏 · 展品均来自公共领域开放馆藏」 |

**加载逻辑**：并发拉取 `exhibits.json` → 校验 → 并发预载全部展品图（缩略级）与 glb；视频只载 poster。进度 = 已就绪项/总项（0.3s ease 平滑，禁止 100% 前跳满）。

**Animation**：挂载时整列 stagger（logo→字标→标题→副题→分隔线→进度区，间隔 0.09s，y 16→0 + opacity 0→1，0.55s `cubic-bezier(.22,1,.36,1)`）；黄铜线 scaleX 0→1（0.7s，delay .5s）；小贴士切换 y 6 淡入淡出 0.3s；按钮可用时描边亮度脉冲一次（box-shadow 0 0 0 4px brass-wash，0.6s）；点击后整页 opacity→0、blur 8px、0.6s `easeInOutQuad`，随后卸载并触发 gallery.md §14 入场运镜。

---

## 3. 入场过渡（衔接段）

见 `gallery.md` §14。覆盖层职责：淡出期间保持 `pointer-events: none`；运镜结束时 HUD 各元件按序入场（TopBar 从 y -12、ZoneLabel 从 x -12、Minimap 从 y 12、ControlHints 淡入；各 0.45s、间隔 0.08s）。

**Animation**：HUD 入场全部 spring（stiffness 240, damping 28）；准星（若第一人称默认——本模板默认第三人称，故不出现）。

---

## 4. HUD — TopBar（顶栏）

**位置**：顶部 16px 内边距，左右分布；高 44px。

| 左 | 右 |
|---|---|
| logo.svg 24px + 「LUMEN 流明」衬线 15px ls .18em（移动端隐去中文） | 视角切换按钮 / 帮助按钮 / 全屏按钮（移动端隐藏全屏） |

按钮统一：40×40px、圆角 999、`--paper` 92% + blur、1px `--line`、icon `--ink`；hover 描边转 `--brass` + scale 1.06（0.18s）；激活态（如第一人称）图标填 `--brass`。
视角切换按钮：第三人称显示 `PersonStanding`、第一人称显示 `Eye`，点击 = `V` 键行为。

**Animation**：图标切换 rotateY 180° 0.3s `easeOut`；按下 scale .92 回弹 spring（stiffness 500, damping 22）。

---

## 5. HUD — ZoneLabel（展区名）

**位置**：TopBar 下方 8px 左对齐（与 logo 列对齐）。

- 主行：当前 `zone.name` `t-zone` 衬线（如「西翼 · 绘画长廊」）
- 副行：`zone.nameEn` mono 10px `--stone` 大写 ls .14em
- 前缀：8×8px 黄铜小方块（展签铆钉意象）

**Animation**：区域变化——旧名 y -8 + opacity→0（0.25s）→ 新名 y +8→0（0.4s `easeOutCubic`）；黄铜方块 scaleX 0→1→1.0 脉冲（0.35s）。

---

## 6. HUD — Minimap（小地图）

**位置**：左下，距边 16px；尺寸 220×104 + 8px padding；`--paper` 92% + blur、圆角 14、1px `--line`、阴影 chip 级。

**内容**（SVG，viewBox `0 0 224 96`，1m = 3.6px，数据源 = zones 矩形）：
- 四个区域矩形：填充 transparent、描边 1px `--ink-38`；当前区域填充 `--brass-wash` + 描边 `--brass`
- 门洞：矩形间留白开口（按 gallery.md §2 平面图）
- 展品点：2.5px 圆点 `--ink-38`；已聚焦展品点 `--brass` 3.5px
- 玩家：6px `--ink` 圆点 + 朝向楔形（18° 扇形，`--brass`），位置/朝向每帧由 ref 直改 transform（不走 React state）

**移动端**：默认收起为右下角 40px 圆形按钮（地图图标），点击展开为全屏 70% 宽抽屉；展开态背景加遮罩。
**Animation**：区域高亮 0.3s 淡入；玩家点移动无动画（实时）；移动端抽屉 spring（stiffness 300, damping 30，x 100%→0）。

---

## 7. HUD — 提示元件

### 7.1 ControlHints（桌面操作提示）
- 位置：右下，距边 16px；单行横排，超出则两行
- 样式：`t-caption` `--ink-60`，键帽 = mono 10px、`--paper-dim` 底、1px `--line`、圆角 6、px 6/ py 2
- 文案：`WASD` 移动 · `Shift` 疾跑 · 拖拽/点击锁定 视角 · 滚轮 缩放 · `E` 查看 · `V` 视角 · `H` 帮助
- 进入探索 8s 后自动收起为 40px 圆形「?」按钮（与帮助同义，hover 展开）

### 7.2 HintChip（聚焦提示）
- 位置：底部居中，距底 32px（移动端在动作键上方）
- 结构（横排 chip，h 44px，圆角 999，`--night` 88% + blur，文字 `--paper`）：
  展品编号 mono 10px `--brass-bright` + 作品名 14px 衬线 + 作者 12px 60% + 分隔点 + `E` 键帽（黄铜底黑字）「查看」
- 移动端：键帽替换为「点按查看」
- **Animation**：出现 spring（stiffness 320, damping 26）：y 12→0 + opacity 0→1；离开 0.2s 反向；切换聚焦对象时内容 crossfade 0.15s（不重新入场）

### 7.3 Esc 提示 toast（指针锁定期间）
- 锁定成功后底部居中显示「移动鼠标环视 · Esc 释放鼠标」2.5s 后淡出；解锁后再次锁定时不再显示（sessionStorage 记忆）
- **Animation**：y 8 淡入 0.3s / 淡出 0.4s

### 7.4 准星（第一人称专属）
- 屏幕中心 6px 圆点 `--brass` + 1px 白描边；悬停可交互展品 → 10px 圆环（border 1.5px）
- **Animation**：0.15s scale 过渡；打开弹窗时 0.2s 淡出

---

## 8. HUD — MobileControls（移动端）

| 元件 | 规格 |
|---|---|
| 虚拟摇杆 | 左下 40% 屏区任意按下生成：底座 Ø120px（`--paper` 40% + 1px `--line`），摇杆头 Ø56px（`--ink` 80%），最大半径 48px；输出向量（死区 8px），模长>0.85 = 疾跑 |
| 视角区 | 右侧 60% 单指拖拽转视角（该区域不响应点击展品以外的 UI） |
| 动作键 | 聚焦时出现于右下：Ø64px 圆形，`--brass` 底、`--paper` 字 13px「查看」；点击 = `E` |
| 视角切换 | TopBar 同款，移动端保留 |
| 点按展品 | 全屏 tap 射线（见 gallery.md §10.2） |

**Animation**：摇杆按下出现 scale .8→1（0.18s `easeOut`），松手收回 0.15s；动作键出现 spring（stiffness 380, damping 24，scale .6→1）+ 每 2s 一次轻脉冲（box-shadow brass-wash 扩散，提示可点）。

---

## 9. 帮助面板 HelpPanel（z 40）

**桌面**：居中卡片 640×auto（max-h 80vh），圆角 14，`--paper` + 阴影卡片级；背后遮罩 `--night` 40% + blur 4px。
**移动端**：底部弹层 92vh 同内容滚动。

**内容**：
| 区 | 内容 |
|---|---|
| 头部 | 「如何参观」衬线 22px + 右上 `X` 关闭 |
| 桌面操作 | 两列网格：键帽 + 说明（移动/疾跑/环视/缩放/查看展品/切换视角/指针锁定/全屏/关闭） |
| 移动端操作 | 四行图示文字：左侧摇杆 移动 · 右侧拖拽 环视 · 双指捏合 缩放 · 点按展品 查看详情 |
| 关于本展 | 一段：模板说明 + 「展品均来自公共领域开放馆藏，仅用于演示」+ 数据来源链接（Met / AIC / Blender） |
| 页脚 | 「按 Esc 或点击空白处关闭」`t-caption` `--stone` |

**Animation**：遮罩 opacity 0→1（0.25s）；卡片 y 24→0 + opacity，spring（stiffness 260, damping 30）；移动端弹层 y 100%→0 同 spring；关闭反向 0.2s `easeIn`。

---

## 10. 展品详情弹窗 ExhibitModal（z 50）★

**气质**：一张放大的博物馆展签 + 高清图。

### 10.1 桌面形态：右侧抽屉
- 宽 420px、全高，贴右；`--paper`、圆角左上/左下 14、1px `--line`、抽屉阴影（design.md §6）
- 背后无遮罩（仍可看见展厅余光，保持"在场感"），点击抽屉外空白 = 关闭

### 10.2 移动端形态：底部弹层
- 高 85vh、圆角上 16、顶部 Ø4×36px 拖拽柄；可下划半收至 40vh（仍露出作品名与操作行）

### 10.3 内容结构（自上而下）

| 块 | 规格 |
|---|---|
| 编号行 | mono 11px `--brass` `P-01 · IMAGE` + 右侧 `X` 关闭（28px 圆形 hover `--paper-dim`） |
| 媒体区 | image：16:10 高清图，圆角 10，点击 = 进灯箱（hover 显示 `ZoomIn` 角标）；video：内嵌播放器（原生 controls，自动带声续播）；model/text/link：无媒体区（link 显示 48px `ExternalLink` 黄铜图标块） |
| 作品名 | `t-title` 衬线（中文）+ `titleEn` 衬线 italic 15px `--stone` |
| 元信息表 | 两列定义列表，行距 8：作者 / 年代 / 媒材 / 来源（label mono 10px `--stone` 大写；value 14px）；字段缺省自动隐藏 |
| 黄铜细线 | 全宽 1px `--brass` 40% |
| 简介 | `t-label` 15px/1.75，两端对齐，长文滚动区 max-h 30vh |
| 操作行 | 主按钮「放大浏览」（image 专属：`--brass` 实底白字 h 40 r 10）· 次按钮「查看来源 ↗」（有 `link` 时：描边钮，新标签页打开）· 次按钮「关闭」（描边钮） |
| 页脚 | `t-caption` `--stone`「素材许可见 ASSETS-LICENSE」 |

**动画时序（打开）**：聚焦运镜进行 0.5s 时抽屉开始滑入（x 100%→0，spring stiffness 260 damping 30）→ 内容 stagger（编号→媒体→标题→元信息→简介→操作行，间隔 0.06s，y 14→0 opacity，0.4s `easeOutCubic`）。关闭：抽屉 x→100% 0.25s `easeIn`，store 回 `explore`。
**Esc 行为**：lightbox > modal > help 逐层关闭。

---

## 11. 图片灯箱 Lightbox（z 60）

- 全屏 `--night` 96%（`rgba(20,18,15,.96)`），无圆角
- 图片居中 `contain`（max 92vw × 88vh），1px `--ink` 细描边 + 深投影，衬在深色上如装裱
- 底部居中图注：作品名 15px 衬线 `--paper` + 作者/年代 12px `--stone`；左下角 mono 10px `--stone` 当前倍率 `×1.0`
- 右上关闭 `X`（40px 圆，`--paper` 20% 底）；底部右侧提示「滚轮缩放 · 拖拽平移」（移动端「双指缩放」），3s 后淡出
- **缩放**：滚轮 / 双指 ×1–×4（指数步进），双击 / 双击放大 1↔2 切换；缩放后单指/左键拖拽平移（边界钳制 + 10% 橡皮筋回弹）
- **Animation**：进入——背景 opacity 0→1（0.25s），图片 scale .92→1 + opacity（0.35s `easeOutCubic`，从弹窗媒体区位置 FLIP 放大更佳，实现侧可用 layoutId）；倍率变化 0.18s `easeOut`；退出反向 0.2s，返回 ExhibitModal 原位

---

## 12. 辅助提示层

| 提示 | 触发 | 规格 |
|---|---|---|
| 横屏建议 | 移动端竖屏首次进入 | 顶部胶囊 toast（h 36，`--night` 88% 底 `--paper` 字）：「旋转设备，横屏体验更佳」+ 关闭 ×；5s 自动消失，sessionStorage 记忆 |
| 锁定丢失 | 桌面探索态且未锁定未拖拽 >6s（仅第一人称） | 底部居中胶囊：「点击画面锁定视角」；点击画布即锁 |
| 加载失败 | 展品图 404 | 3D 侧画芯显示米色占位 + mono「素材缺失」；弹窗媒体区显示 `--paper-dim` 占位 + 说明文字，其余信息正常 |

**Animation**：toast 一律 y -8→0 淡入 0.3s / 淡出 0.4s；占位元素 0.3s 淡入。

---

## 13. 共用 UI 元件清单

| 元件 | 规格 |
|---|---|
| `IconButton` | 40px 圆，纸底 blur，hover 黄铜描边 + scale 1.06；按下 .92 回弹 |
| `Button`（主/次） | h 40 / px 20 / r 10 / `t-ui` 600；主 = `--brass` 实底白字，hover `--brass-bright`；次 = 1px `--line` 描边，hover 描边 `--brass` |
| `KeyCap` | mono 10px、`--paper-dim`、1px `--line`、r 6、min-w 22 居中 |
| `Chip` | h 44 / r 999 / `--night` 88% + blur / `--paper` 字 |
| `MetaRow` | label mono 10px 大写 `--stone` + value 14px，gap 8 |
| `Drawer` | 右抽屉（桌面）/ 底部弹层（移动）双形态容器，spring 入场 |
| `Toast` | 顶部或底部胶囊，自动消失 |

**Animation（元件级通则）**：所有可点元件 hover 0.18s `easeOut`；按下 scale .92 回弹 spring（stiffness 500, damping 22）；禁用态 opacity .38 无动效；焦点可见（`:focus-visible` 1.5px `--brass` 外环，键盘可达性）。
