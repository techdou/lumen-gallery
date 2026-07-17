/**
 * zones.ts — 区域判定（与碰撞、小地图共用数据，gallery.md §12）
 *
 * 判定顺序 [media, painting, sculpture, hall]：翼厅优先，
 * 门洞重叠区（|x|<12 的 z∈[-7,7] 以外）自然归入 hall 兜底。
 */
import type { Zone } from '@/config/schema';

const ORDER = ['media', 'painting', 'sculpture', 'hall'];

/** 判定坐标所属展区 id（找不到时返回 hall） */
export function zoneAt(x: number, z: number, zones: Zone[]): string {
  for (const id of ORDER) {
    const zn = zones.find((v) => v.id === id);
    if (!zn) continue;
    const [minX, minZ, maxX, maxZ] = zn.bounds;
    if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) return id;
  }
  return 'hall';
}

/**
 * 建筑户型合同（几何与碰撞共用）：
 * 每个区域 { bounds, height, floor: 'concrete'|'oak' }
 */
export const FLOOR_PLAN = [
  { id: 'hall', bounds: [-12, -7, 12, 7] as const, height: 6.0, floor: 'concrete' as const },
  { id: 'painting', bounds: [-28, -5, -12, 5] as const, height: 4.2, floor: 'oak' as const },
  { id: 'sculpture', bounds: [12, -5, 28, 5] as const, height: 4.2, floor: 'oak' as const },
  { id: 'media', bounds: [-7, -17, 7, -7] as const, height: 4.2, floor: 'concrete' as const },
];

/** 门洞清单（宽 6m 高 3.6m）：墙体开洞与小地图留白共用 */
export const OPENINGS = [
  { wall: 'hall-north', axis: 'x' as const, at: -7, from: -3, to: 3 },
  { wall: 'hall-west', axis: 'z' as const, at: -12, from: -3, to: 3 },
  { wall: 'hall-east', axis: 'z' as const, at: 12, from: -3, to: 3 },
];
