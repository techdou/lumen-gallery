/**
 * Ceiling.tsx — 四区平顶 + 天窗发光膜（Skylight）。
 * 序厅顶两条 10×1.2m 长形发光膜（z=±3），影像厅一条 6×1m；
 * 自发光暖白，入场时强度 0.8→1.6 缓升 2.5s（"开灯"）。
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { plasterTexture } from '@/scene/textures';
import { FLOOR_PLAN } from '@/systems/zones';
import { MAT } from '@/config/site';
import { useStore } from '@/state/store';

export default function Ceiling() {
  const plaster = useMemo(() => plasterTexture(), []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: MAT.wall, map: plaster, roughness: 0.92 }),
    [plaster],
  );
  const skyMat = useRef<THREE.MeshStandardMaterial>(null);
  const t0 = useRef<number | null>(null);

  // 天窗"开灯"缓升：entering 开始后 2.5s 内 intensity 0.8→1.6
  useFrame((_, dt) => {
    const st = useStore.getState().appState;
    if (!skyMat.current) return;
    if (st === 'entering' || st === 'explore' || st === 'modal' || st === 'lightbox' || st === 'help') {
      if (t0.current === null) t0.current = 0;
      t0.current = Math.min(1, t0.current + dt / 2.5);
      const k = 1 - Math.pow(1 - t0.current, 3); // easeOutCubic
      skyMat.current.emissiveIntensity = 0.8 + 0.8 * k;
    }
  });

  return (
    <group>
      {FLOOR_PLAN.map((z) => {
        const [minX, minZ, maxX, maxZ] = z.bounds;
        return (
          <mesh
            key={z.id}
            position={[(minX + maxX) / 2, z.height, (minZ + maxZ) / 2]}
            rotation={[Math.PI / 2, 0, 0]}
            material={mat}
          >
            <planeGeometry args={[maxX - minX, maxZ - minZ]} />
          </mesh>
        );
      })}
      {/* 天窗发光膜（略低于顶面，避免 z-fight） */}
      {([[-3, 10, 1.2], [3, 10, 1.2]] as const).map(([z, w, d]) => (
        <mesh key={`sky${z}`} position={[0, 5.96, z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial
            ref={z === -3 ? skyMat : undefined}
            color={MAT.skylight}
            emissive={MAT.skylight}
            emissiveIntensity={1.6}
          />
        </mesh>
      ))}
      <mesh position={[0, 4.16, -12]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 1]} />
        <meshStandardMaterial color={MAT.skylight} emissive={MAT.skylight} emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}
