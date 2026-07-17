/**
 * textures.ts — 运行时程序化 CanvasTexture（零外部依赖、许可干净）
 *
 * 生成：抛光混凝土 / 浅橡木地板 / 暖白灰泥墙 / 软影斑 / 博物馆标签 / 信息面板。
 * 若要换成真实 CC0 纹理文件，把 USE_FILE_TEXTURES 置 true 并放入 /assets/textures/。
 * 关键步骤均有注释；所有纹理颜色空间 SRGB、anisotropy 4、全部 mipmap。
 */
import * as THREE from 'three';
import type { Exhibit } from '@/config/schema';

export const USE_FILE_TEXTURES = false;

const cache = new Map<string, THREE.CanvasTexture>();

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!];
}

function toTexture(c: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

/** 细颗粒噪点（灰泥/混凝土的"骨料感"） */
function sprinkle(
  ctx: CanvasRenderingContext2D,
  size: number,
  count: number,
  alpha: number,
  light: boolean,
) {
  for (let i = 0; i < count; i++) {
    const g = Math.random();
    ctx.fillStyle = light
      ? `rgba(255,252,244,${(g * alpha).toFixed(3)})`
      : `rgba(60,52,40,${(g * alpha).toFixed(3)})`;
    const r = Math.random() * 1.6 + 0.4;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 主厅：抛光暖灰混凝土（2m 平铺） */
export function concreteTexture(): THREE.CanvasTexture {
  const key = 'concrete';
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = makeCanvas(512);
  ctx.fillStyle = '#BDB5A6';
  ctx.fillRect(0, 0, 512, 512);
  // 大面积极弱斑驳
  for (let i = 0; i < 40; i++) {
    const g = ctx.createRadialGradient(
      Math.random() * 512, Math.random() * 512, 0,
      Math.random() * 512, Math.random() * 512, 60 + Math.random() * 120,
    );
    const dark = Math.random() > 0.5;
    g.addColorStop(0, dark ? 'rgba(120,110,95,0.05)' : 'rgba(235,230,218,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  }
  sprinkle(ctx, 512, 2600, 0.05, false);
  sprinkle(ctx, 512, 2000, 0.05, true);
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

/** 侧厅：浅橡木直拼地板（板宽 12cm 错缝，2m 平铺 ≈ 16 板） */
export function oakTexture(): THREE.CanvasTexture {
  const key = 'oak';
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = makeCanvas(512);
  ctx.fillStyle = '#B89B75';
  ctx.fillRect(0, 0, 512, 512);
  const boards = 16; // 512px / 16 ≈ 32px/板 ≈ 12cm
  const bw = 512 / boards;
  for (let b = 0; b < boards; b++) {
    // 每板明度微差
    const l = 0.94 + Math.random() * 0.12;
    ctx.fillStyle = `rgb(${Math.round(184 * l)},${Math.round(155 * l)},${Math.round(117 * l)})`;
    ctx.fillRect(b * bw, 0, bw, 512);
    // 直纹细腻纹理
    for (let i = 0; i < 26; i++) {
      ctx.strokeStyle = `rgba(120,92,60,${0.03 + Math.random() * 0.05})`;
      ctx.lineWidth = 0.8;
      const x = b * bw + Math.random() * bw;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 3, 170, x - 3, 340, x + 1, 512);
      ctx.stroke();
    }
    // 错缝（每板一条横向接缝，位置错开）
    const seamY = ((b * 197) % 512 + 512) % 512;
    ctx.fillStyle = 'rgba(90,68,45,0.35)';
    ctx.fillRect(b * bw, seamY, bw, 1.4);
    // 板间缝
    ctx.fillStyle = 'rgba(90,68,45,0.28)';
    ctx.fillRect(b * bw, 0, 1, 512);
  }
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

/** 墙面：暖白灰泥（1.5m 平铺，近乎纯色弱凹凸） */
export function plasterTexture(): THREE.CanvasTexture {
  const key = 'plaster';
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = makeCanvas(512);
  ctx.fillStyle = '#F1EDE3';
  ctx.fillRect(0, 0, 512, 512);
  sprinkle(ctx, 512, 3200, 0.028, false);
  sprinkle(ctx, 512, 2600, 0.04, true);
  const t = toTexture(c);
  cache.set(key, t);
  return t;
}

/** 软影斑：径向渐变（中心 rgba(0,0,0,.35) → 0） */
export function shadowBlobTexture(): THREE.CanvasTexture {
  const key = 'blob';
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = makeCanvas(256);
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.35)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.16)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

/** 等宽字体串 */
const MONO = '"IBM Plex Mono", "Courier New", monospace';
const SERIF = 'Fraunces, "Noto Serif SC", "Songti SC", serif';
const SANS = 'Manrope, "Noto Sans SC", "PingFang SC", sans-serif';

/**
 * 博物馆标签（wall-frame 右下，14×9cm，Canvas 排版）：
 * mono 编号 / 衬线作品名 / 作者·年代（灰）。
 */
export function labelTexture(e: Exhibit): THREE.CanvasTexture {
  const key = `label-${e.id}`;
  if (cache.has(key)) return cache.get(key)!;
  const w = 280;
  const h = 180;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#F8F5EE';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(34,31,26,0.15)';
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#A67C3D';
  ctx.font = `500 20px ${MONO}`;
  ctx.fillText(e.id, 20, 18);
  ctx.fillStyle = '#221F1A';
  ctx.font = `600 26px ${SERIF}`;
  ctx.fillText(clipText(ctx, e.title, w - 40), 20, 52);
  ctx.fillStyle = '#8A8375';
  ctx.font = `400 20px ${SANS}`;
  const sub = [e.artist, e.year].filter(Boolean).join(' · ');
  ctx.fillText(clipText(ctx, sub, w - 40), 20, 96);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

function clipText(ctx: CanvasRenderingContext2D, s: string, maxW: number): string {
  if (ctx.measureText(s).width <= maxW) return s;
  let out = s;
  while (out.length > 1 && ctx.measureText(out + '…').width > maxW) out = out.slice(0, -1);
  return out + '…';
}

/** Canvas 自动换行排版，返回实际用到的行数 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  maxLines: number,
): number {
  let line = '';
  let lines = 0;
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW || ch === '\n') {
      ctx.fillText(line, x, y + lines * lineH);
      lines++;
      line = ch === '\n' ? '' : ch;
      if (lines >= maxLines) return lines;
    } else {
      line += ch;
    }
  }
  if (line && lines < maxLines) {
    ctx.fillText(line, x, y + lines * lineH);
    lines++;
  }
  return lines;
}

/**
 * 信息面板纹理（text / link，1.2×0.9m 亚克力面板）：
 * 白底、衬线标题 + 无衬线正文自动换行；link 面板加黄铜描边 + 外链提示行。
 */
export function panelTexture(e: Exhibit, accent: string): THREE.CanvasTexture {
  const key = `panel-${e.id}`;
  if (cache.has(key)) return cache.get(key)!;
  const w = 768;
  const h = 576;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#F8F5EE';
  ctx.fillRect(0, 0, w, h);
  const isLink = e.type === 'link';
  ctx.strokeStyle = isLink ? accent : 'rgba(34,31,26,0.15)';
  ctx.lineWidth = isLink ? 4 : 2;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  ctx.textBaseline = 'top';
  ctx.fillStyle = '#A67C3D';
  ctx.font = `500 22px ${MONO}`;
  ctx.fillText(`${e.id} · ${e.type.toUpperCase()}`, 48, 40);

  ctx.fillStyle = '#221F1A';
  ctx.font = `600 44px ${SERIF}`;
  ctx.fillText(clipText(ctx, e.title, w - 96), 48, 84);
  // 黄铜短线
  ctx.fillStyle = accent;
  ctx.fillRect(48, 152, 96, 4);

  ctx.fillStyle = '#4A453B';
  ctx.font = `400 25px ${SANS}`;
  wrapText(ctx, e.description, 48, 188, w - 96, 44, 7);

  if (isLink) {
    ctx.fillStyle = '#A67C3D';
    ctx.font = `600 26px ${SANS}`;
    ctx.fillText('点击访问 ↗', 48, h - 72);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

/** 标题墙纹理（序厅北墙左段）：中文标题 + 英文 mono + 黄铜细线 */
export function titleWallTexture(title: string, titleEn: string, accent: string): THREE.CanvasTexture {
  const key = `title-${title}`;
  if (cache.has(key)) return cache.get(key)!;
  const w = 1024;
  const h = 384;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#2A2723';
  ctx.font = `500 132px ${SERIF}`;
  ctx.fillText(title, 8, 30);
  ctx.fillStyle = accent;
  ctx.fillRect(10, 220, 320, 6);
  ctx.fillStyle = '#8A8375';
  ctx.font = `500 44px ${MONO}`;
  ctx.fillText(titleEn.toUpperCase(), 10, 264);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}
