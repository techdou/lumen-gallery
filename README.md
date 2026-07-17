# LUMEN 流明 · 3D 虚拟展览馆模板

一个**可复用**的浏览器端 3D 虚拟美术馆模板：一次搭建，换数据即换展。
适用于作品集展示、品牌宣传、艺术展览、博物馆、数字展厅等场景。

- 渲染引擎：Three.js + React Three Fiber（TypeScript）
- 数据驱动：全部展品由 `public/data/exhibits.json` 配置，**无需改代码**即可换展
- 演示内容：19 件公共领域（Public Domain / CC0 / CC-BY）艺术品，来源与许可见 `public/assets/ASSETS-LICENSE.md`

> **在线预览**：`https://<你的 GitHub 用户名>.github.io/lumen-gallery/`（推送 `main` 分支后 GitHub Actions 自动构建部署，见下文「部署」）

---

## 一、快速启动

```bash
# 环境要求：Node.js 22+
npm install        # 安装依赖
npm run dev        # 开发模式，默认 http://localhost:3000
npm run build      # 类型检查 + 生产构建，输出 dist/
npm run preview    # 本地预览构建产物
npm run lint       # ESLint 代码检查
```

浏览器打开后：加载完成 → 点击「进入展厅」→ 开始漫游。

### 操作方式

| 平台 | 操作 |
|---|---|
| 桌面 | `WASD / 方向键` 行走 · `Shift` 疾跑 · 鼠标拖拽（或点击画面锁定指针）转视角 · 滚轮缩放 · `V` 切换第一/第三人称 · `E` 查看聚焦展品 · `H` 帮助 · `Esc` 返回/释放指针 |
| 移动端 | 左下虚拟摇杆移动 · 右侧屏幕拖拽转视角 · 双指捏合缩放 · 点按展品直接打开详情 |

靠近展品时：射灯增亮 + 地面黄铜光环呼吸，按 `E` 或点击打开博物馆标签式详情弹窗；图片类展品支持「放大浏览」进入全屏灯箱（滚轮/捏合缩放 ×1–×4）。

顶栏「角色」按钮可在 5 个内置角色间即时切换（CC0 游戏角色 + 经典陶瓷人台），配置见「三、角色系统」。

---

## 二、换展只需三步（核心用法）

> 类比：`exhibits.json` 是「展览策划案」，代码是「展馆建筑与工作人员」。换展 = 换策划案 + 换展品，建筑不动。

1. **放素材** —— 把新素材放进 `public/assets/` 对应目录：
   - 图片 → `artworks/`（JPG，长边 ≤1600px）
   - 视频 → `videos/`（MP4 + 同名 poster.jpg）
   - 模型 → `models/`（GLB，建议 Draco 压缩 ≤2MB；不配模型会自动用程序化抽象雕塑占位）
2. **改配置** —— 编辑 `public/data/exhibits.json`：改 `gallery` 展览文案与出生点，增删 `exhibits` 数组里的展品（字段见下表）。
3. **刷新** —— 标题墙、前言面板、小地图、弹窗全部自动更新。

### exhibits.json 字段速查

```jsonc
{
  "gallery": {                       // 展览全局信息
    "title": "经典的回响", "titleEn": "Echoes of the Masters",
    "subtitle": "…", "preface": "…",  // 前言显示在序厅面板
    "spawn": { "position": [0,0,5.2], "headingDeg": 180 },  // 出生点
    "accent": "#A67C3D"               // 主题强调色（聚焦光环/按钮）
  },
  "zones": [ /* 展区，bounds=[minX,minZ,maxX,maxZ]，同时驱动碰撞与小地图 */ ],
  "exhibits": [{
    "id": "P-01",                    // 唯一编号
    "type": "image",                 // image | video | model | text | link
    "zone": "painting",              // 所属 zones[].id
    "mount": "wall-frame",           // wall-frame | pedestal | vitrine | screen | panel
    "title": "神奈川冲浪里", "titleEn": "The Great Wave",
    "artist": "葛饰北斋", "year": "c.1831", "medium": "木刻版画",
    "credit": "大都会艺术博物馆 · Public Domain",
    "description": "…",               // 弹窗正文（≤300字）
    "src": "/assets/artworks/hokusai-wave.jpg",
    "position": [-16, 1.6, -4.94],   // 世界坐标（米）
    "rotationDeg": 0,                // 朝向，0 = 面向 +Z
    "size": { "w": 1.6, "h": 1.1 },  // 物理尺寸（米）
    "frame": "black",                // oak | black | gilt | none（wall-frame 专用）
    "focusRadius": 2.6,              // 聚焦触发半径（可选）
    "spotlight": true,               // 是否配轨道射灯（可选）
    "spin": true                     // pedestal 展品缓速自转（可选）
  }]
}
```

**类型 × 展陈方式**：image→wall-frame/vitrine · text→panel · video→screen · model→pedestal · link→panel（带「前往访问 ↗」按钮）。
配置错误（坐标越界 / zone 不存在 / 类型不符）时控制台输出**中文警告并跳过该展品**，不会让整个展览崩掉。

### 坐标怎么定？

展厅是固定几何（序厅 + 西翼绘画长廊 + 东翼雕塑厅 + 北侧影像厅，共 19 个预留点位）。所有墙画 `position` 的 X/Z 贴墙（墙面坐标见 `src/scene/architecture/Walls.tsx` 顶部注释与 `design/gallery.md` 平面图），Y 为画面中心高（挂画一般 1.6m）；座地展品 Y=0。运行时看浏览器控制台的警告可快速定位配错的展品。

---

## 三、角色系统（characters.json）

漫游角色由 `public/data/characters.json` 配置驱动：顶栏「角色」按钮（或加载页「选择角色 →」）
打开选择器即时切换，原地淡入生效；选择持久化到 localStorage（`lumen.character`），下次访问自动恢复。

### 内置角色一览

| id | 名称 | 定位 | 模型 | 身高 |
|---|---|---|---|---|
| casual-man | 阿澈 | 休闲男观众 | Quaternius（CC0） | 1.78m |
| casual-woman | 小满 | 休闲女观众 | Quaternius（CC0） | 1.70m |
| business-man | 顾先生 | 商务正装 | Quaternius（CC0） | 1.80m |
| worker | 老周 | 场馆工作人员 | Quaternius（CC0） | 1.76m |
| mannequin | 流明人台 | 经典人台 | 内置程序化（无 GLB） | 1.75m |

### characters.json 字段

```jsonc
{
  "default": "casual-man",          // 默认角色 id（本地未选择时使用）
  "characters": [{
    "id": "casual-man",             // 唯一编号
    "name": "阿澈",                 // 选择器卡片主标题
    "label": "休闲男观众",           // 定位标签
    "desc": "…",                    // 一句话描述
    "src": "/assets/characters/casual-man.glb",  // GLB 路径；null = 内置程序化人台
    "height": 1.78,                 // 目标身高（米）：按包围盒等比缩放、脚底对齐地面
    "clips": {                      // 可选：动画 clip 名映射（命名不符约定时用）
      "idle": "CharacterArmature|Idle",
      "walk": "CharacterArmature|Walk",
      "run":  "CharacterArmature|Run"
    }
  }]
}
```

配置错误（字段缺失 / id 重复 / default 不存在）时控制台输出**中文警告**并跳过坏条目或回退默认；
整个文件缺失或彻底不合法时回退为「仅内置人台」，不阻断展览。

### 添加自己的角色

1. 把 GLB 放进 `public/assets/characters/`（建议 ≤2MB，含骨骼动画）。
2. 在 `characters.json` 的 `characters` 数组里加一条配置（字段见上）。
3. 动画命名约定：需含 `CharacterArmature|Idle`、`CharacterArmature|Walk`、`CharacterArmature|Run`
   三条 clip（Quaternius 角色包天然符合；注意包内 `animations[0]` 是 Death，务必**按名索引**）。
   命名不同则用 `clips` 字段显式映射（如 `"idle": "MyRig|Stand"`）。
4. 模型需 **+Z 朝前**建模（与朝向约定一致）；身高由 `height` 字段归一化，无需手动缩放。

动画状态机：速度 <0.1 m/s 播 Idle、<3.1 m/s 播 Walk、更快播 Run（疾跑），
切换时 0.25s crossFade 平滑过渡。全部 GLB 在加载页统一预载并计入进度条，
运行中切换角色为内存缓存命中、无需等待。

---

## 四、目录说明

```
public/
  data/exhibits.json        ★ 展品配置文件（换展改这里）
  data/characters.json      ★ 角色配置文件（换角色改这里）
  assets/
    artworks/  videos/  models/  textures/   # 素材目录（换展替换这里）
    characters/                              # 角色 GLB（Quaternius CC0）
    ASSETS-LICENSE.md                          # 演示素材来源与许可清单
src/
  config/     schema.ts（展品+角色 TS 类型 + zod 校验）· site.ts（速度/相机/灯光预算常量）
  state/      store.ts（zustand 状态机：loading→ready→entering→explore⇄modal⇄lightbox⇄characters）
  scene/      Gallery.tsx（Canvas 根组件）
    architecture/   墙体 / 地板 / 天花 / 轨道 / 标题墙（固定几何）
    exhibits/       ExhibitRoot（按配置分发）→ WallFrame / Pedestal / Vitrine / Screen / Panel
    lighting/       半球光+天窗平行光 / 展品射灯 / SpotScheduler（就近激活 ≤8 盏）
    cameras/        ThirdPersonRig / FirstPersonRig / IntroDolly / CameraDirector
    Avatar.tsx（多角色：GLB 骨骼动画 + 程序化人台回退）· FocusRing.tsx · textures.ts（程序化纹理）
  systems/    PlayerController（行走/转向/疾跑）· collision.ts（胶囊 vs AABB/圆柱）
              zones.ts（区域判定）· interaction.ts（最近展品聚焦 + 射线点击）
              controls/  键盘 / 指针视角 / 触屏摇杆与捏合
  ui/         LoadingOverlay / HUD / CharacterSelector（角色选择器）/ Minimap(SVG 小地图) / ExhibitModal / Lightbox / 移动端控件等
scripts/
  smoke-characters.mjs      # 角色系统冒烟测试（GLB clip 校验 + characters.json zod 校验）
```

组件均可单独抽离复用：例如把 `scene/exhibits/WallFrame.tsx` 拿走就是一个带博物馆标签的画框组件。

---

## 五、技术要点（为什么这么设计）

- **数据驱动**：展品、展区、文案、出生点全部来自 JSON；代码零硬编码内容。
- **碰撞**：角色是胶囊体，墙体/展台是 AABB/圆柱，逐帧解算推挤——墙体数据与 `zones` 共用同一份坐标合同，不会出现「撞墙判定和小地图不一致」。
- **灯光预算**：同屏投影光源 ≤4（1 盏 2048 平行光 + ≤3 盏 512 射灯），射灯按玩家距离就近激活——美术馆可以挂 19 盏灯，但只点亮你身边的几盏，帧率才稳。
- **移动端降级**：pixelRatio 限制 1.5、关闭射灯阴影、玻璃改磨砂、雾裁远景。
- **弹窗降帧**：打开弹窗时 3D 降到 30fps 省电；`frameloop` 按需推进。
- **纹理零依赖**：地板/灰泥墙纹理由 `src/scene/textures.ts` 运行时 Canvas 程序化生成，无外部素材、许可干净。

### URL 参数（可选）

| 参数 | 作用 |
|---|---|
| `?enter=1` | 资源就绪后自动进入展厅（kiosk / 嵌入式数字展厅免点击） |
| `?lowspec=1` | 低性能模式：关阴影、渲染分辨率减半、关抗锯齿（极弱设备兜底） |

## 六、常见问题

- **构建报错 `Cannot find module 'framer-motion'`**？说明 `node_modules` 是旧模板的，`npm install` 一次即可（依赖在 package.json 里已声明）。
- **展品没出现**？打开浏览器控制台看中文警告——90% 是 `position` 越界或 `zone` 拼写与 zones[].id 不一致。
- **图片黑/裂**？检查 `src` 路径是否以 `/assets/...` 开头（public 目录下的文件用根路径引用，不要写 `public/`）。
- **想换/加角色模型**？把 glb 放进 `public/assets/characters/`，在 `public/data/characters.json` 里加一条配置即可（动画命名约定与 `clips` 映射见「三、角色系统」），无需改代码。

## 七、许可

- 代码：MIT（可自由商用/二改）
- 演示素材：全部为公共领域或 CC0/CC-BY 资源，逐件来源见 `public/assets/ASSETS-LICENSE.md`；视频为 Blender 基金会《Sintel》预告片（CC-BY 3.0）；角色模型为 Quaternius 出品（Public Domain / CC0）。换成自己的素材后请更新该清单。

---

## 八、部署到 GitHub Pages（一键自动）

仓库已配置 Actions workflow（`.github/workflows/deploy.yml`），推送到 `main` 分支即自动构建并部署到 GitHub Pages，无需手动操作。

### 首次部署三步

1. **建仓库**：在 GitHub 创建名为 `lumen-gallery` 的空仓库，按提示推代码即可：
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/lumen-gallery.git
   git push -u origin main
   ```
2. **开启 Pages**：仓库 `Settings → Pages → Build and deployment → Source` 选 **GitHub Actions**（不是 Branch）。这一步只需做一次。
3. **等部署**：Actions 跑完（约 2 分钟）后访问 `https://<你的用户名>.github.io/lumen-gallery/`。

### 改仓库名怎么办？

`base` 路径写死在两处，改名需同步更新：

- `vite.config.ts` 的 `base: '/lumen-gallery/'`
- `public/404.html` 里的 `basePath`

如果部署到用户主页仓库 `<用户名>.github.io`，把两处都改成 `'/'`。

### 手动部署到其他静态托管

```bash
npm run build
# 把 dist/ 目录上传到任意静态托管（Vercel / Netlify / Cloudflare Pages / Surge）
# 注意：托管在子路径下时，把 vite.config.ts 的 base 改成对应子路径
```

