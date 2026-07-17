/**
 * SpotScheduler.ts — 射灯调度（gallery.md §4 预算与调度）。
 *
 * 规则：常亮 1 盏（C-01 中央展台；标题墙洗墙灯由 TitleWall 自带射灯承担）+
 * 距玩家最近 N 盏（桌面 7 / 移动 4），每 0.3s 重算一次。
 * ExhibitSpot 每帧读取 activeIds 并做 0.4s 淡入淡出，避免突变。
 */
import type { Exhibit } from '@/config/schema';
import { PERF } from '@/config/site';

const ALWAYS_ON = new Set(['C-01']);

/** 当前应激活的射灯 id 集合 */
export const activeSpotIds = new Set<string>(ALWAYS_ON);

let timer = 0;

/** 每帧调用；内部 0.3s 节流重算 */
export function updateSpotSchedule(dt: number, px: number, pz: number, exhibits: Exhibit[]): void {
  timer -= dt;
  if (timer > 0) return;
  timer = 0.3;
  const near = PERF.maxActiveSpots - ALWAYS_ON.size;
  const sorted = exhibits
    .filter((e) => e.spotlight && !ALWAYS_ON.has(e.id))
    .map((e) => ({ id: e.id, d: Math.hypot(e.position[0] - px, e.position[2] - pz) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, near);
  activeSpotIds.clear();
  for (const id of ALWAYS_ON) activeSpotIds.add(id);
  for (const s of sorted) activeSpotIds.add(s.id);
}
