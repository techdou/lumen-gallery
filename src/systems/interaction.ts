/**
 * interaction.ts — 最近展品聚焦判定 + 点击射线（gallery.md §13）
 *
 * 聚焦判定（每 0.1s 节流调用一次）：
 * 1. 候选 = 与玩家水平距离 < focusRadius（默认 2.6m）的展品；
 * 2. 第三人称：在候选中取「玩家朝向与展品方向夹角 < 55°」的距离最近者；
 * 3. 第一人称：直接以「相机视线方向与展品方向夹角 < 30°」取最近者（视线更直觉）。
 */
import type { Exhibit } from '@/config/schema';
import { INTERACT } from '@/config/site';

/** 归一化角度差到 [-PI, PI] */
function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/**
 * 计算当前聚焦展品。
 * @param px/pz 玩家位置
 * @param heading 玩家朝向（弧度，0=面向+Z；第一人称传相机 yaw）
 * @param exhibits 全部展品
 * @param firstPerson 是否第一人称
 */
export function computeFocus(
  px: number,
  pz: number,
  heading: number,
  exhibits: Exhibit[],
  firstPerson: boolean,
): Exhibit | null {
  let best: Exhibit | null = null;
  let bestDist = Infinity;
  const maxAngle = firstPerson ? (30 * Math.PI) / 180 : INTERACT.focusAngle;
  for (const e of exhibits) {
    const dx = e.position[0] - px;
    const dz = e.position[2] - pz;
    const d = Math.hypot(dx, dz);
    const radius = e.focusRadius ?? 2.6;
    if (d > radius || d >= bestDist) continue;
    // 展品方向角（玩家→展品）
    const dir = Math.atan2(dx, dz);
    if (angleDiff(dir, heading) > maxAngle) continue;
    best = e;
    bestDist = d;
  }
  return best;
}

/**
 * 计算"观赏位"：展品正前方 viewDistance 米、正对展品的站位。
 * 墙面件沿其法线（rotationDeg 方向）外移；座地件取玩家当前方位与展品连线上 2.2m 处。
 */
export function computeViewSpot(e: Exhibit, px: number, pz: number): { x: number; z: number; yaw: number } {
  const [ex, , ez] = e.position;
  const rot = ((e.rotationDeg ?? 0) * Math.PI) / 180;
  if (e.mount === 'wall-frame' || e.mount === 'screen' || e.mount === 'panel') {
    // 法线 = 展品朝向（0=面向+Z）
    const nx = Math.sin(rot);
    const nz = Math.cos(rot);
    const vx = ex + nx * INTERACT.viewDistance;
    const vz = ez + nz * INTERACT.viewDistance;
    return { x: vx, z: vz, yaw: Math.atan2(ex - vx, ez - vz) };
  }
  // 座地件：沿玩家→展品反方向后退
  let dx = px - ex;
  let dz = pz - ez;
  const d = Math.hypot(dx, dz);
  if (d < 0.3) {
    dx = 0;
    dz = 1;
  } else {
    dx /= d;
    dz /= d;
  }
  const vx = ex + dx * INTERACT.viewDistance;
  const vz = ez + dz * INTERACT.viewDistance;
  return { x: vx, z: vz, yaw: Math.atan2(ex - vx, ez - vz) };
}
