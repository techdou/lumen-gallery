# 素材许可清单 · ASSETS-LICENSE

本目录全部演示素材均来自公共领域（Public Domain / CC0）或 CC-BY 授权，仅用于模板演示。
获取日期：2026-07-17。换展时请同步替换本清单。

## 绘画 / 器物照片（public/assets/artworks/）

| 文件 | 作品 | 作者 | 年代 | 来源机构 | 许可 | 来源 URL |
|---|---|---|---|---|---|---|
| vangogh-selfportrait.jpg | 戴草帽的自画像（Self-Portrait with a Straw Hat） | 文森特·梵高 | 1887 | 大都会艺术博物馆（Met #436532） | Public Domain (CC0) | https://collectionapi.metmuseum.org/public/collection/v1/objects/436532 |
| hokusai-wave.jpg | 神奈川冲浪里（Under the Wave off Kanagawa） | 葛饰北斋 | 约 1830–32 | 大都会艺术博物馆（Met #36491） | Public Domain (CC0) | https://collectionapi.metmuseum.org/public/collection/v1/objects/36491 |
| vermeer-pitcher.jpg | 持水壶的年轻女子（Young Woman with a Water Pitcher） | 约翰内斯·维米尔 | 约 1662 | 大都会艺术博物馆（Met #437881） | Public Domain (CC0) | https://collectionapi.metmuseum.org/public/collection/v1/objects/437881 |
| pissarro-jalais.jpg | 蓬图瓦兹的雅莱山丘（Jalais Hill, Pontoise） | 卡米耶·毕沙罗 | 1867 | 大都会艺术博物馆（Met #437299） | Public Domain (CC0) | https://collectionapi.metmuseum.org/public/collection/v1/objects/437299 |
| morisot-pinkdress.jpg | 粉色连衣裙（The Pink Dress） | 贝尔特·莫里索 | 约 1870 | 大都会艺术博物馆（Met #438009） | Public Domain (CC0) | https://collectionapi.metmuseum.org/public/collection/v1/objects/438009 |
| seurat-grande-jatte.jpg | 《大碗岛的星期天下午》习作（Study for "A Sunday on La Grande Jatte"） | 乔治·修拉 | 1884 | 大都会艺术博物馆（Met #437658） | Public Domain (CC0) | https://collectionapi.metmuseum.org/public/collection/v1/objects/437658 |
| degas-dance.jpg | 舞蹈课（The Dance Class） | 埃德加·德加 | 1874 | 大都会艺术博物馆（Met #438817） | Public Domain (CC0) | https://collectionapi.metmuseum.org/public/collection/v1/objects/438817 |
| leutze-washington.jpg | 华盛顿横渡特拉华河（Washington Crossing the Delaware） | 埃玛纽埃尔·洛伊茨 | 1851 | 大都会艺术博物馆（Met #11417） | Public Domain (CC0) | https://collectionapi.metmuseum.org/public/collection/v1/objects/11417 |
| vangogh-cypresses.jpg | 麦田与柏树（Wheat Field with Cypresses） | 文森特·梵高 | 1889 | 大都会艺术博物馆（Met #437980） | Public Domain (CC0) | https://collectionapi.metmuseum.org/public/collection/v1/objects/437980 |
| qing-vase.jpg | 青花釉里红龙纹梅瓶（Meiping vase with dragons amid waves） | 中国景德镇窑 | 18 世纪中叶 | 大都会艺术博物馆（Met #42368） | Public Domain (CC0) | https://collectionapi.metmuseum.org/public/collection/v1/objects/42368 |
| greek-amphora.jpg | 红绘/黑绘双耳陶瓶（Terracotta amphora, Andokides） | 古希腊阿提卡 | 约公元前 530 年 | 大都会艺术博物馆（Met #255154） | Public Domain (CC0) | https://collectionapi.metmuseum.org/public/collection/v1/objects/255154 |

注：以上图片均由大都会开放获取原图缩放至长边 1600px 用于网页演示。
原设计清单中的莫奈《睡莲池上的桥》（Met #437127 图像非公共领域）、卡萨特《孩童沐浴》与修拉大碗岛成作（芝加哥 AIC 图床在本环境被访问限制拦截）已按规则替换为同馆公共领域作品：毕沙罗、莫里索、修拉《大碗岛》习作。

## 视频（public/assets/videos/）

| 文件 | 作品 | 作者 | 年代 | 来源 | 许可 | 来源 URL |
|---|---|---|---|---|---|---|
| bbb.mp4 | 《Sintel》预告片（Sintel Trailer, 480p） | Blender Foundation | 2010 | Blender 基金会官方镜像 | CC-BY 3.0 | https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4 |
| bbb-poster.jpg | 《Sintel》预告片海报帧（自 bbb.mp4 第 12 秒抽取） | Blender Foundation | 2010 | 同上 | CC-BY 3.0 | 同上 |

注：文件名保留模板点位名 `bbb.*`，内容为 Blender 基金会开源电影《Sintel》预告片（CC-BY 3.0，署名 Blender Foundation，durian 项目）。弹窗与许可中如实标注。

## 3D 模型（public/assets/models/）

首版未随附 glb：CC0 雕塑扫描在本环境无可靠直链。所有 `type: model` 展品由
`src/scene/exhibits/` 内的**程序化几何回退雕塑**呈现（纯代码生成，无第三方素材、许可干净）。
放入自有 glb 的方法见 `models/README.txt`。

## 纹理（public/assets/textures/）

地板 / 灰泥墙 / 软影斑均为**运行时程序化 CanvasTexture**（`src/scene/textures.ts`），
纯代码生成、零外部依赖、许可干净。详见 `textures/README.txt`。

## 字体

界面字体（Fraunces / Manrope / IBM Plex Mono / Noto Serif SC / Noto Sans SC）经系统字体栈与
Google Fonts（Open Font License）在运行时引用；未随包分发字体文件。

## 角色模型（public/assets/characters/）

漫游角色模型，均出自 Quaternius《Ultimate Animated Character Pack》，经 Poly Pizza 分发；
每个 GLB 内含 24 个骨骼动画（Idle / Walk / Run / Wave 等，命名 `CharacterArmature|*`）。

| 文件 | 角色 | 作者 | 来源 | 许可 | 来源 URL |
|---|---|---|---|---|---|
| casual-man.glb | 休闲男观众（Casual Character） | Quaternius | Poly Pizza | Public Domain (CC0) | https://poly.pizza/m/kZ3DmIoGip |
| casual-woman.glb | 休闲女观众（Animated Woman） | Quaternius | Poly Pizza | Public Domain (CC0) | https://poly.pizza/m/qJ2gsTUBHL |
| business-man.glb | 商务正装（Business Man） | Quaternius | Poly Pizza | Public Domain (CC0) | https://poly.pizza/m/JFrLIKqvCH |
| worker.glb | 场馆工作人员（Worker） | Quaternius | Poly Pizza | Public Domain (CC0) | https://poly.pizza/m/Yg2bQZO6Hj |

获取日期：2026-07-17。「流明人台」为 `src/scene/Avatar.tsx` 内置程序化几何角色，纯代码生成、许可干净。
