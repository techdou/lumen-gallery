/**
 * MuseumLabel.tsx — 博物馆标签牌。
 * variant='wall'：挂在画框右下侧墙面（14×9cm，y 1.35m）；
 * variant='floor'：立于台前地面的 15° 斜面小座。
 * 聚焦时自发光 0→.08 便于阅读（300ms 线性）。
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Exhibit } from '@/config/schema';
import { labelTexture } from '@/scene/textures';
import { useStore } from '@/state/store';

export default function MuseumLabel({ exhibit, variant }: { exhibit: Exhibit; variant: 'wall' | 'floor' }) {
  const tex = useMemo(() => labelTexture(exhibit), [exhibit]);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef(0);

  useFrame((_, dt) => {
    // 聚焦态自发光 300ms 线性插值
    const focused = useStore.getState().focusedId === exhibit.id;
    const target = focused ? 0.08 : 0;
    glow.current += Math.sign(target - glow.current) * Math.min(Math.abs(target - glow.current), dt / 0.3);
    if (matRef.current) matRef.current.emissiveIntensity = glow.current;
  });

  const material = (
    <meshStandardMaterial
      ref={matRef}
      map={tex}
      roughness={0.6}
      emissive="#FFFFFF"
      emissiveMap={tex}
      emissiveIntensity={0}
    />
  );

  if (variant === 'floor') {
    // 台前地面 15° 斜面小座（牌面朝上倾向观众）
    return (
      <group position={[0.35, 0, 0.62]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.17, 0.06, 0.12]} />
          <meshStandardMaterial color="#F1EDE3" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.062, 0.008]} rotation={[-Math.PI / 2 + (15 * Math.PI) / 180, 0, 0]}>
          <planeGeometry args={[0.14, 0.09]} />
          {material}
        </mesh>
      </group>
    );
  }
  return (
    <mesh>
      <planeGeometry args={[0.14, 0.09]} />
      {material}
    </mesh>
  );
}
