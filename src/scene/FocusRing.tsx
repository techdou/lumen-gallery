/**
 * FocusRing.tsx — 聚焦地环：Ø1.1m 黄铜细环。
 * 聚焦时 opacity 0→.6（300ms）后 1.6s 呼吸脉冲（scale 1↔1.045，opacity .5↔.9）。
 */
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MAT } from '@/config/site';
import { useStore } from '@/state/store';

export default function FocusRing({ exhibitId, radius = 0.55, y = 0.015 }: { exhibitId: string; radius?: number; y?: number }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const level = useRef(0); // 0=隐藏 1=完全出现
  const breath = useRef(0);

  useFrame((_, dt) => {
    const focused = useStore.getState().focusedId === exhibitId;
    const target = focused ? 1 : 0;
    // 300ms 淡入淡出
    level.current += Math.sign(target - level.current) * Math.min(Math.abs(target - level.current), dt / 0.3);
    if (level.current > 0) breath.current += dt;
    const m = matRef.current;
    const g = meshRef.current;
    if (!m || !g) return;
    g.visible = level.current > 0.01;
    // 呼吸：1.6s 周期 scale 1↔1.045、不透明度 .5↔.9
    const pulse = (Math.sin((breath.current / 1.6) * Math.PI * 2) + 1) / 2;
    const k = level.current;
    m.opacity = k * (0.5 + 0.4 * pulse) * 0.9;
    const s = k * (1 + 0.045 * pulse);
    g.scale.set(s, s, s);
  });

  return (
    <mesh ref={meshRef} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[radius - 0.02, radius, 48]} />
      <meshBasicMaterial ref={matRef} color={MAT.brassBright} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
