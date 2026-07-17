如何放入自己的 3D 模型（glb）
==============================

1. 将模型文件（建议 Draco 压缩、单个 ≤ 2MB）放入本目录，例如 venus.glb。
2. 在 /public/data/exhibits.json 中找到对应 type = "model" 的展品，
   将 "src" 字段设为 "/assets/models/venus.glb"。
3. 可用 "modelScale" 调整缩放（模型将按包围盒居中放置在展台顶面）。
4. 未提供 src 时，模板会自动使用程序化几何回退雕塑，保证零素材也能运行。

推荐素材来源（公共领域 / CC0）：
- threedscans.com（古典雕塑扫描）
- Scan the World（CC0 / CC-BY 注意署名）
- Poly Haven（CC0）
