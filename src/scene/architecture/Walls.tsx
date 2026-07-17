/**
 * Walls.tsx — 全部墙体（含门洞过梁）、踢脚线、门洞包边、入口拱门、长凳。
 *
 * 墙体数据与 systems/collision.ts 的 AABB 清单、zones.ts 户型共用同一份坐标合同
 * （gallery.md §2.1，墙厚 0.3m）。门洞宽 6m 高 3.6m，过梁补齐门洞上方。
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { plasterTexture, shadowBlobTexture } from '@/scene/textures';
import { MAT } from '@/config/site';

/** 一段墙体盒：cx,cz 中心；len 长度；axis 'x'（东西向墙）| 'z'；y0,y1 高度区间 */
interface WallSeg { cx: number; cz: number; len: number; axis: 'x' | 'z'; y0: number; y1: number }
const T = 0.3; // 墙厚

/** 墙体段清单（与碰撞 AABB 一致；门洞处由过梁补上方） */
const WALL_SEGS: WallSeg[] = [
  // 序厅南 z=+7（整段，入口不可通行），高 6
  { cx: 0, cz: 7, len: 24.6, axis: 'x', y0: 0, y1: 6 },
  // 序厅北 z=-7（门洞 x∈[-3,3]）
  { cx: -7.65, cz: -7, len: 9.3, axis: 'x', y0: 0, y1: 6 },
  { cx: 7.65, cz: -7, len: 9.3, axis: 'x', y0: 0, y1: 6 },
  { cx: 0, cz: -7, len: 6, axis: 'x', y0: 3.6, y1: 6 }, // 过梁
  // 序厅西 x=-12（门洞 z∈[-3,3]）
  { cx: -12, cz: -5, len: 4.15, axis: 'z', y0: 0, y1: 6 },
  { cx: -12, cz: 5, len: 4.15, axis: 'z', y0: 0, y1: 6 },
  { cx: -12, cz: 0, len: 6, axis: 'z', y0: 3.6, y1: 6 }, // 过梁
  // 序厅东 x=+12
  { cx: 12, cz: -5, len: 4.15, axis: 'z', y0: 0, y1: 6 },
  { cx: 12, cz: 5, len: 4.15, axis: 'z', y0: 0, y1: 6 },
  { cx: 12, cz: 0, len: 6, axis: 'z', y0: 3.6, y1: 6 }, // 过梁
  // 绘画长廊（高 4.2）：北/南/西
  { cx: -20.15, cz: -5, len: 16.3, axis: 'x', y0: 0, y1: 4.2 },
  { cx: -20.15, cz: 5, len: 16.3, axis: 'x', y0: 0, y1: 4.2 },
  { cx: -28, cz: 0, len: 10.6, axis: 'z', y0: 0, y1: 4.2 },
  // 雕塑厅（高 4.2）：北/南/东
  { cx: 20.15, cz: -5, len: 16.3, axis: 'x', y0: 0, y1: 4.2 },
  { cx: 20.15, cz: 5, len: 16.3, axis: 'x', y0: 0, y1: 4.2 },
  { cx: 28, cz: 0, len: 10.6, axis: 'z', y0: 0, y1: 4.2 },
  // 影像厅（高 4.2）：北/西/东
  { cx: 0, cz: -17, len: 14.6, axis: 'x', y0: 0, y1: 4.2 },
  { cx: -7, cz: -12.15, len: 10.3, axis: 'z', y0: 0, y1: 4.2 },
  { cx: 7, cz: -12.15, len: 10.3, axis: 'z', y0: 0, y1: 4.2 },
];

/** 踢脚线条（沿墙脚室内侧，高 8cm 深 1.2cm；门洞处断开） */
const BASE_SEGS: WallSeg[] = WALL_SEGS.filter((s) => s.y0 === 0);

/** 门洞包边（深炭黑 8cm 宽）：[x, z, 轴] 三处 6m 门洞 */
const OPENINGS: { x: number; z: number; axis: 'x' | 'z' }[] = [
  { x: 0, z: -7, axis: 'x' }, // 序厅 ↔ 影像厅
  { x: -12, z: 0, axis: 'z' }, // 序厅 ↔ 绘画翼
  { x: 12, z: 0, axis: 'z' }, // 序厅 ↔ 雕塑翼
];

export default function Walls() {
  const plaster = useMemo(() => {
    const t = plasterTexture();
    return t;
  }, []);
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: MAT.wall, map: plaster, roughness: 0.92 }),
    [plaster],
  );
  const trimMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: MAT.trim, roughness: 0.5 }),
    [],
  );
  const blob = useMemo(() => shadowBlobTexture(), []);

  return (
    <group>
      {/* 墙体（合并共享材质与几何） */}
      {WALL_SEGS.map((s, i) => (
        <mesh
          key={`w${i}`}
          position={[s.cx, (s.y0 + s.y1) / 2, s.cz]}
          material={wallMat}
          castShadow={false}
          receiveShadow
        >
          <boxGeometry args={s.axis === 'x' ? [s.len, s.y1 - s.y0, T] : [T, s.y1 - s.y0, s.len]} />
        </mesh>
      ))}

      {/* 踢脚线（每段墙两面各一条） */}
      {BASE_SEGS.map((s, i) => {
        const off = T / 2 + 0.006;
        return [off, -off].map((o, j) => (
          <mesh
            key={`b${i}-${j}`}
            position={[
              s.cx + (s.axis === 'x' ? 0 : o),
              0.04,
              s.cz + (s.axis === 'x' ? o : 0),
            ]}
            material={trimMat}
          >
            <boxGeometry args={s.axis === 'x' ? [s.len, 0.08, 0.012] : [0.012, 0.08, s.len]} />
          </mesh>
        ));
      })}

      {/* 门洞包边：两侧立柱 + 顶部横眉（"画框式"空间层次） */}
      {OPENINGS.map((o, i) => (
        <group key={`o${i}`} position={[o.x, 0, o.z]} rotation={[0, o.axis === 'x' ? 0 : Math.PI / 2, 0]}>
          {[-3, 3].map((s) => (
            <mesh key={s} position={[s + (s < 0 ? 0.04 : -0.04), 1.8, 0]} material={trimMat}>
              <boxGeometry args={[0.08, 3.6, T + 0.04]} />
            </mesh>
          ))}
          <mesh position={[0, 3.6 - 0.04, 0]} material={trimMat}>
            <boxGeometry args={[6.08, 0.08, T + 0.04]} />
          </mesh>
        </group>
      ))}

      {/* 入口拱门（南墙内侧装饰造型 + 玻璃 + 门外发光白盒，不可通行） */}
      <group position={[0, 0, 6.83]}>
        {/* 门洞造型：两柱 + 拱眉 */}
        {[-2.5, 2.5].map((x) => (
          <mesh key={x} position={[x, 1.8, 0]} material={trimMat}>
            <boxGeometry args={[0.24, 3.6, 0.2]} />
          </mesh>
        ))}
        <mesh position={[0, 3.55, 0]} material={trimMat}>
          <boxGeometry args={[5.24, 0.24, 0.2]} />
        </mesh>
        {/* 固定玻璃 */}
        <mesh position={[0, 1.8, 0]}>
          <planeGeometry args={[4.76, 3.5]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.05}
            transparent
            opacity={0.12}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 门外发光白盒（"出口日光"错觉） */}
        <mesh position={[0, 1.9, 0.5]}>
          <boxGeometry args={[5, 3.8, 0.5]} />
          <meshBasicMaterial color="#FFF9EC" />
        </mesh>
      </group>

      {/* 长凳 ×3（白立方 + 假投影） */}
      {([[-4, 2], [4, 2], [0, -13.5]] as const).map(([x, z], i) => (
        <group key={`bench${i}`} position={[x, 0, z]}>
          <mesh position={[0, 0.225, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.45, 0.45]} />
            <meshStandardMaterial color={MAT.pedestal} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.1, 0.75]} />
            <meshBasicMaterial map={blob} transparent depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
