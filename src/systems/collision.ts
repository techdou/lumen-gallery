/**
 * collision.ts — 胶囊 vs AABB / 圆柱 碰撞系统（gallery.md §11）
 *
 * 关键思路：
 * 1. 角色是半径 r 的胶囊（y 恒 0 的平整地面，故退化为 2D 圆）；
 * 2. 障碍分两类：墙体 AABB（minX,minZ,maxX,maxZ）与圆柱障碍（展台/展柜/长凳近似）；
 * 3. 每帧对期望位移后的新位置逐一检测重叠，沿**最小穿透轴**把角色推出，迭代 2 次，
 *    自然得到"沿墙滑动"效果，无卡角；
 * 4. 障碍总数 < 40，逐一检测开销可忽略，无需空间索引。
 */

export interface AABB {
  kind: 'aabb';
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
}

export interface Cylinder {
  kind: 'cyl';
  x: number;
  z: number;
  r: number;
}

export type Obstacle = AABB | Cylinder;

/** 全部静态障碍（墙体 + 座地构件） */
const obstacles: Obstacle[] = [];

/** 注册障碍（建筑/展陈组件初始化时调用） */
export function registerObstacle(o: Obstacle): void {
  obstacles.push(o);
}

export function registerObstacles(list: Obstacle[]): void {
  obstacles.push(...list);
}

/** 清空（热更新/重建场景时） */
export function clearObstacles(): void {
  obstacles.length = 0;
}

export function getObstacles(): readonly Obstacle[] {
  return obstacles;
}

/**
 * 把点 (px,pz) 从单个障碍中推出，返回修正后的坐标。
 * 圆 vs AABB：找 AABB 上最近点，距离 < r 则沿"最近点→圆心"方向推出。
 * 圆 vs 圆柱：圆心距 < r+R 则沿连线推出。
 */
function pushOut(px: number, pz: number, r: number, o: Obstacle): [number, number] {
  if (o.kind === 'aabb') {
    // AABB 上离圆心最近的点
    const cx = Math.max(o.minX, Math.min(px, o.maxX));
    const cz = Math.max(o.minZ, Math.min(pz, o.maxZ));
    let dx = px - cx;
    let dz = pz - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) return [px, pz]; // 无重叠
    if (d2 > 1e-8) {
      // 圆心在 AABB 外：沿法线推出
      const d = Math.sqrt(d2);
      const k = (r - d) / d;
      return [px + dx * k, pz + dz * k];
    }
    // 圆心在 AABB 内：沿最小穿透轴推出
    const dl = px - o.minX + r;
    const dr = o.maxX - px + r;
    const dn = pz - o.minZ + r;
    const ds = o.maxZ - pz + r;
    const m = Math.min(dl, dr, dn, ds);
    if (m === dl) return [o.minX - r, pz];
    if (m === dr) return [o.maxX + r, pz];
    if (m === dn) return [px, o.minZ - r];
    return [px, o.maxZ + r];
  }
  // 圆柱
  let dx = px - o.x;
  let dz = pz - o.z;
  const rr = r + o.r;
  const d2 = dx * dx + dz * dz;
  if (d2 >= rr * rr) return [px, pz];
  if (d2 < 1e-8) {
    // 圆心重合的退化情形：沿 +Z 推出
    dx = 0;
    dz = 1;
  }
  const d = Math.sqrt(Math.max(d2, 1e-8));
  const k = (rr - d) / d;
  return [px + dx * k, pz + dz * k];
}

/**
 * 求解移动后的合法位置：期望位置 → 逐障碍推出（迭代 2 次）→ 滑墙效果。
 * 返回 [x, z, collided]。
 */
export function resolveMove(px: number, pz: number, r: number): [number, number, boolean] {
  let x = px;
  let z = pz;
  let hit = false;
  for (let iter = 0; iter < 2; iter++) {
    for (const o of obstacles) {
      const [nx, nz] = pushOut(x, z, r, o);
      if (nx !== x || nz !== z) hit = true;
      x = nx;
      z = nz;
    }
  }
  return [x, z, hit];
}

/**
 * 线段 vs 障碍的相机避障（spherecast 简化版，2D）：
 * 从 (x0,z0) 向 (x1,z1) 投射半径 r 的圆，返回首个命中比例 t∈(0,1]，无命中返回 1。
 * 仅用于第三人称相机收距，粗略即可。
 */
export function castSegment(x0: number, z0: number, x1: number, z1: number, r: number): number {
  let best = 1;
  const steps = 24;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    for (const o of obstacles) {
      if (o.kind !== 'aabb') continue; // 相机避障只关心墙体
      // 圆与 AABB 重叠判定
      const cx = Math.max(o.minX, Math.min(x, o.maxX));
      const cz = Math.max(o.minZ, Math.min(z, o.maxZ));
      const dx = x - cx;
      const dz = z - cz;
      if (dx * dx + dz * dz < r * r) {
        best = Math.min(best, Math.max(0, t - 1 / steps));
        break;
      }
    }
    if (best < 1) break;
  }
  return best;
}

/**
 * 按 gallery.md §2.1 生成全部墙体 AABB（墙厚 0.3m）与座地障碍。
 * 墙体数据与 zones 矩形共用同一份户型合同。
 */
export function buildArchitectureObstacles(): Obstacle[] {
  const T = 0.3; // 墙厚
  const list: Obstacle[] = [];
  // 墙体以边界线为中心（内墙面 = 中心 ±0.15），与 WALL_SEGS / 展品坐标一致
  const wall = (minX: number, minZ: number, maxX: number, maxZ: number) =>
    list.push({ kind: 'aabb', minX, minZ, maxX, maxZ });

  // 序厅南 z=+7（整段，入口不可通行）
  wall(-12.3, 7 - T / 2, 12.3, 7 + T / 2);
  // 序厅北 z=-7（门洞 x∈[-3,3]）
  wall(-12.3, -7 - T / 2, -3, -7 + T / 2);
  wall(3, -7 - T / 2, 12.3, -7 + T / 2);
  // 序厅西 x=-12（门洞 z∈[-3,3]）
  wall(-12 - T / 2, -7.15, -12 + T / 2, -3);
  wall(-12 - T / 2, 3, -12 + T / 2, 7.15);
  // 序厅东 x=+12（门洞 z∈[-3,3]）
  wall(12 - T / 2, -7.15, 12 + T / 2, -3);
  wall(12 - T / 2, 3, 12 + T / 2, 7.15);
  // 绘画厅 北 z=-5 / 南 z=+5；西墙 x=-28
  wall(-28.3, -5 - T / 2, -12, -5 + T / 2);
  wall(-28.3, 5 - T / 2, -12, 5 + T / 2);
  wall(-28 - T / 2, -5.3, -28 + T / 2, 5.3);
  // 雕塑厅 北 z=-5 / 南 z=+5；东墙 x=+28
  wall(12, -5 - T / 2, 28.3, -5 + T / 2);
  wall(12, 5 - T / 2, 28.3, 5 + T / 2);
  wall(28 - T / 2, -5.3, 28 + T / 2, 5.3);
  // 影像厅 北 z=-17；西 x=-7；东 x=+7
  wall(-7.3, -17 - T / 2, 7.3, -17 + T / 2);
  wall(-7 - T / 2, -17.3, -7 + T / 2, -7);
  wall(7 - T / 2, -17.3, 7 + T / 2, -7);

  // 座地障碍（圆柱）：中央展台 r0.6、雕塑展台 r0.45×3、展柜 r0.5×2
  list.push({ kind: 'cyl', x: 0, z: -0.5, r: 0.6 });
  list.push({ kind: 'cyl', x: 16.5, z: 0, r: 0.45 });
  list.push({ kind: 'cyl', x: 20, z: 0, r: 0.45 });
  list.push({ kind: 'cyl', x: 23.5, z: 0, r: 0.45 });
  list.push({ kind: 'cyl', x: 18.25, z: -3.8, r: 0.5 });
  list.push({ kind: 'cyl', x: 21.75, z: -3.8, r: 0.5 });
  // 长凳 AABB 1.8×0.45 ×3
  const bench = (x: number, z: number) =>
    list.push({ kind: 'aabb', minX: x - 0.9, minZ: z - 0.225, maxX: x + 0.9, maxZ: z + 0.225 });
  bench(-4, 2);
  bench(4, 2);
  bench(0, -13.5);
  return list;
}
