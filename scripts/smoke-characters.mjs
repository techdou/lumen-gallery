/**
 * smoke-characters.mjs — 多角色系统冒烟测试（node scripts/smoke-characters.mjs）
 * 1. 校验 4 个角色 GLB：glTF 魔数、>1MB、含 Idle/Walk/Run clip（按名索引，不依赖下标）；
 * 2. characters.json 通过 zod 校验（esbuild 打包 src/config/schema.ts 后真实执行）；
 * 3. 反向用例：坏配置不抛错、回退内置人台（parseCharactersFile 容错契约）。
 * 退出码非 0 即失败。
 */
import { readFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSync } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const charDir = join(root, 'public/assets/characters');
let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};

/* ---------- 1. GLB 检查 ---------- */
console.log('[1] 角色 GLB 检查');
const GLBS = ['casual-man.glb', 'casual-woman.glb', 'business-man.glb', 'worker.glb'];
for (const name of GLBS) {
  const p = join(charDir, name);
  if (!existsSync(p)) {
    bad(`${name} 不存在`);
    continue;
  }
  const buf = readFileSync(p);
  if (buf.length <= 1_000_000) bad(`${name} 体积 ${buf.length}B ≤ 1MB，疑似下载不完整`);
  else ok(`${name} 体积 ${(buf.length / 1024 / 1024).toFixed(2)}MB`);
  if (buf.subarray(0, 4).toString('ascii') !== 'glTF') {
    bad(`${name} 魔数不是 glTF`);
    continue;
  }
  ok(`${name} 魔数 glTF`);
  // 解析 JSON chunk，收集动画名
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const names = (json.animations ?? []).map((a) => a.name ?? '');
  for (const clip of ['Idle', 'Walk', 'Run']) {
    const hit = names.some((n) => n === `CharacterArmature|${clip}` || n.endsWith(`|${clip}`) || n === clip);
    if (hit) ok(`${name} 含 ${clip} clip`);
    else bad(`${name} 缺少 ${clip} clip（现有：${names.join(', ')}）`);
  }
  if (names[0] === 'CharacterArmature|Death') ok(`${name} animations[0] 为 Death（必须按名索引，已确认）`);
}

/* ---------- 2. characters.json zod 校验 ---------- */
console.log('[2] characters.json zod 校验');
// esbuild 打包真实 schema.ts（zod v4），在 node 中执行同一份校验逻辑
const entry = join(root, 'scripts/.smoke-entry.ts');
const out = join(root, 'scripts/.smoke-bundle.mjs');
writeFileSync(
  entry,
  `export { parseCharactersFile, FALLBACK_CHARACTERS } from '../src/config/schema';\n`,
);
buildSync({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent' });
const { parseCharactersFile, FALLBACK_CHARACTERS } = await import(out);
rmSync(entry, { force: true });
rmSync(out, { force: true });

const raw = JSON.parse(readFileSync(join(root, 'public/data/characters.json'), 'utf8'));
const data = parseCharactersFile(raw);
if (data.default && data.characters.length > 0) ok(`校验通过：default=${data.default}，共 ${data.characters.length} 个角色`);
else bad('characters.json 校验未通过');
if (data.default !== 'casual-man') bad(`default 应为 casual-man，实际 ${data.default}`);
else ok('default = casual-man');
if (data.characters.length !== 5) bad(`应含 5 个角色，实际 ${data.characters.length}`);
for (const c of data.characters) {
  if (c.src) {
    const fp = join(root, 'public', c.src.replace(/^\//, ''));
    if (existsSync(fp)) ok(`角色「${c.name}」src 文件存在：${c.src}`);
    else bad(`角色「${c.name}」src 文件不存在：${c.src}`);
  } else {
    ok(`角色「${c.name}」为内置程序化人台（src=null）`);
  }
}
// clips 可选映射字段存在性（schema 支持即可，本配置未启用）
if (!('clips' in data.characters[0])) ok('clips 为可选字段（未配置时缺省，符合约定）');

/* ---------- 3. 反向用例：坏数据回退 ---------- */
console.log('[3] 容错回退用例');
const broken = parseCharactersFile({ default: 'ghost', characters: [{ id: 'x' }, 42, { id: 'y', name: '好', label: '好', src: '/a.glb', height: 1.7 }] });
if (broken.default === 'y' && broken.characters.length === 1) ok('坏条目跳过 + default 回退首项');
else bad(`坏数据回退异常：${JSON.stringify(broken)}`);
const garbage = parseCharactersFile('not an object');
if (garbage.default === FALLBACK_CHARACTERS.default && garbage.characters[0].src === null) ok('顶层非法 → 回退内置人台');
else bad('顶层非法未回退内置人台');

/* ---------- 汇总 ---------- */
if (failures > 0) {
  console.error(`\n冒烟测试失败：${failures} 项未通过`);
  process.exit(1);
}
console.log('\n冒烟测试全部通过');
