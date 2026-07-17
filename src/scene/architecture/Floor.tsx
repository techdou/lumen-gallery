/**
 * Floor.tsx — 四区地面：主厅/影像厅抛光混凝土、两翼浅橡木（gallery.md §2 表）。
 * 纹理 2m 平铺（repeat = 尺寸/2，克隆纹理实例），混凝土弱反射 .5、橡木 .35。
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { concreteTexture, oakTexture } from '@/scene/textures';
import { FLOOR_PLAN } from '@/systems/zones';
import { MAT } from '@/config/site';

export default function Floor() {
  // 每区克隆一份纹理并设置 repeat（2m 平铺）
  const items = useMemo(
    () =>
      FLOOR_PLAN.map((z) => {
        const [minX, minZ, maxX, maxZ] = z.bounds;
        const w = maxX - minX;
        const d = maxZ - minZ;
        const base = z.floor === 'concrete' ? concreteTexture() : oakTexture();
        const tex = base.clone();
        tex.repeat.set(w / 2, d / 2);
        tex.needsUpdate = true;
        const mat = new THREE.MeshStandardMaterial({
          color: z.floor === 'concrete' ? MAT.floorHall : MAT.floorOak,
          map: tex,
          roughness: z.floor === 'concrete' ? 0.35 : 0.55,
          envMapIntensity: z.floor === 'concrete' ? 0.5 : 0.35,
        });
        return { id: z.id, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, w, d, mat };
      }),
    [],
  );

  return (
    <group>
      {items.map((f) => (
        <mesh key={f.id} position={[f.cx, 0, f.cz]} rotation={[-Math.PI / 2, 0, 0]} material={f.mat} receiveShadow>
          <planeGeometry args={[f.w, f.d, 1, 1]} />
        </mesh>
      ))}
    </group>
  );
}
