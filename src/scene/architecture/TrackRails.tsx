/**
 * TrackRails.tsx — 通长黑色轨道（距墙 0.9m、距顶 0.15m，宽 4cm 哑光黑）。
 * 轨道清单同时被 ExhibitSpot 用作射灯挂载参考。
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { MAT } from '@/config/site';

/** [cx, y, cz, len, axis] 轴 'x' 沿东西、'z' 沿南北 */
export const RAILS: [number, number, number, number, 'x' | 'z'][] = [
  [0, 5.85, -0.5, 2, 'x'],        // 中央展台上空 2m 短轨
  [-10.95, 5.85, 0, 13, 'z'],     // 序厅西墙（H-01）
  [10.95, 5.85, 0, 13, 'z'],      // 序厅东墙（H-02）
  [-20, 4.05, -3.95, 15, 'x'],    // 绘画翼北墙
  [-20, 4.05, 3.95, 15, 'x'],     // 绘画翼南墙
  [-27.05, 4.05, 0, 8, 'z'],      // 绘画翼西墙
  [20, 4.05, 0, 14, 'x'],         // 雕塑翼中央（展台）
  [20, 4.05, -3.0, 8, 'x'],       // 雕塑翼展柜
  [0, 4.05, -15.95, 12, 'x'],     // 影像厅北墙（屏幕）
];

export default function TrackRails() {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: MAT.trackShell, roughness: 0.5, metalness: 0.1 }),
    [],
  );
  return (
    <group>
      {RAILS.map(([cx, y, cz, len, axis], i) => (
        <mesh key={i} position={[cx, y, cz]} material={mat}>
          <boxGeometry args={axis === 'x' ? [len, 0.03, 0.04] : [0.04, 0.03, len]} />
        </mesh>
      ))}
    </group>
  );
}
