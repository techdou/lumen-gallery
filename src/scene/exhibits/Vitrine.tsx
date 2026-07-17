/**
 * Vitrine.tsx — 展柜构件（vitrine，image/model 小型）。
 * 白基座 0.6×0.6×0.8 + 玻璃罩 0.55×0.55×0.9（移动端改磨砂）+ 顶部内嵌微型射灯
 * （常亮微呼吸 ±5%，3s）+ 内部 0.4m 高立式相片牌（15° 后仰）+ 假投影 + 标签。
 */
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { Exhibit } from '@/config/schema';
import { MAT, PERF } from '@/config/site';
import { shadowBlobTexture } from '@/scene/textures';
import MuseumLabel from './MuseumLabel';
import { assetUrl } from '@/utils/asset';

/** 展柜内立牌（0.4m 高，15° 后仰） */
function PhotoCard({ e }: { e: Exhibit }) {
  const tex = useTexture(assetUrl(e.src));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const img = tex.image as HTMLImageElement | undefined;
  const ratio = img ? img.width / img.height : 0.75;
  const h = e.size?.h ?? 0.55;
  const w = Math.min(h * ratio, 0.4);
  return (
    <mesh castShadow>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function Vitrine({ exhibit: e }: { exhibit: Exhibit }) {
  const blob = useMemo(() => shadowBlobTexture(), []);
  const lampRef = useRef<THREE.PointLight>(null);
  const t = useRef(Math.random() * 3);

  // 内嵌灯常亮微呼吸（intensity ±5%，3s 周期）
  useFrame((_, dt) => {
    t.current += dt;
    if (lampRef.current) lampRef.current.intensity = 0.5 * (1 + 0.05 * Math.sin((t.current / 3) * Math.PI * 2));
  });

  return (
    <group>
      {/* 白基座 */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.8, 0.6]} />
        <meshStandardMaterial color={MAT.pedestal} roughness={0.85} />
      </mesh>
      {/* 假投影 */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial map={blob} transparent depthWrite={false} />
      </mesh>
      {/* 内部立牌（15° 后仰） */}
      <group position={[0, 1.08, 0.02]} rotation={[-(15 * Math.PI) / 180, 0, 0]}>
        <Suspense fallback={null}>
          <PhotoCard e={e} />
        </Suspense>
      </group>
      {/* 玻璃罩（移动端磨砂降级） */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.55, 0.9, 0.55]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={PERF.glassFrosted ? 0.6 : 0.05}
          transparent
          opacity={PERF.glassFrosted ? 0.3 : 0.14}
          depthWrite={false}
        />
      </mesh>
      {/* 顶部内嵌微型射灯 */}
      <pointLight ref={lampRef} position={[0, 1.62, 0]} color="#FFE3C2" intensity={0.5} distance={1.2} decay={2} />
      <mesh position={[0, 1.68, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
        <meshBasicMaterial color="#FFE3C2" />
      </mesh>
      {/* 标签 */}
      <MuseumLabel exhibit={e} variant="floor" />
    </group>
  );
}
