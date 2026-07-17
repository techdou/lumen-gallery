/**
 * Panel.tsx — 信息面板构件（panel，text/link）。
 * 1.2×0.9m 亚克力面板，凸墙 2.5cm，四角黄铜铆钉；
 * text 白底排版 / link 黄铜描边 + 外链提示（纹理由 panelTexture 生成）。
 * 聚焦时铆钉微亮。
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Exhibit } from '@/config/schema';
import { MAT } from '@/config/site';
import { panelTexture } from '@/scene/textures';
import { useStore } from '@/state/store';

export default function Panel({ exhibit: e }: { exhibit: Exhibit }) {
  const accent = useStore((s) => s.data?.gallery.accent) ?? MAT.brass;
  const w = e.size?.w ?? 1.2;
  const h = e.size?.h ?? 0.9;
  const tex = useMemo(() => panelTexture(e, accent), [e, accent]);
  const rivetMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: MAT.brass, roughness: 0.35, metalness: 0.85,
        emissive: MAT.brassBright, emissiveIntensity: 0,
      }),
    [],
  );
  const glow = useRef(0);

  // 聚焦时铆钉微亮（300ms 线性）
  useFrame((_, dt) => {
    const focused = useStore.getState().focusedId === e.id;
    const target = focused ? 0.5 : 0;
    glow.current += Math.sign(target - glow.current) * Math.min(Math.abs(target - glow.current), dt / 0.3);
    rivetMat.emissiveIntensity = glow.current;
  });

  const rx = w / 2 - 0.04;
  const ry = h / 2 - 0.04;
  return (
    <group>
      {/* 面板（凸墙 2.5cm） */}
      <mesh position={[0, 0, 0.012]} castShadow>
        <boxGeometry args={[w, h, 0.024]} />
        <meshStandardMaterial color="#F8F5EE" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.6} />
      </mesh>
      {/* 四角黄铜铆钉 */}
      {([[-rx, -ry], [rx, -ry], [-rx, ry], [rx, ry]] as const).map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.03]} material={rivetMat}>
          <sphereGeometry args={[0.012, 12, 8]} />
        </mesh>
      ))}
    </group>
  );
}
