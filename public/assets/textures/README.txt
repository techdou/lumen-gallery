关于纹理素材
============

首版的地面（混凝土 / 橡木）、墙面灰泥、软影斑纹理均为运行时程序化生成
（见 src/scene/textures.ts，CanvasTexture，零外部依赖、许可干净），
因此本目录无需放置任何文件。

如需替换为真实 PBR 纹理（推荐 CC0 来源：ambientCG / Poly Haven）：
1. 将 floor-concrete.jpg / floor-oak.jpg / wall-plaster.jpg / shadow-blob.png
   放入本目录（建议 1024×1024）。
2. 在 src/scene/textures.ts 中将对应 USE_FILE_TEXTURES 开关改为 true 即可
   （或自行改为 useTexture 加载本目录文件）。
