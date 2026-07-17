/**
 * TitleWall.tsx — 序厅北墙左段标题墙：
 * 中文标题（衬线 1.1m 字高）+ 英文 mono + 黄铜细线，文案数据驱动（gallery.title/titleEn）。
 * 黄铜线在入场运镜定格后 0.6s 内 scaleX 0→1 生长（easeOutCubic）。
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { titleWallTexture } from '@/scene/textures';
import { useStore } from '@/state/store';

export default function TitleWall() {
  const gallery = useStore((s) => s.data?.gallery);
  const accent = gallery?.accent ?? '#A67C3D';
  const tex = useMemo(
    () => (gallery ? titleWallTexture(gallery.title, gallery.titleEn ?? '', accent) : null),
    [gallery, accent],
  );
  const lineRef = useRef<THREE.Mesh>(null);
  const t = useRef<number | null>(null);
  // 洗墙灯目标（挂在同组内，保证矩阵更新）
  const washTarget = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, dt) => {
    if (!lineRef.current) return;
    const st = useStore.getState().appState;
    if (st === 'explore' || st === 'modal' || st === 'lightbox' || st === 'help') {
      if (t.current === null) t.current = 0;
      t.current = Math.min(1, t.current + dt / 0.6);
      const k = 1 - Math.pow(1 - t.current, 3);
      lineRef.current.scale.x = Math.max(0.001, k);
    }
  });

  if (!tex) return null;
  return (
    <group position={[-7.5, 2.6, -6.82]}>
      {/* 深色亚克力字凸出墙面 3cm：底板 + 文字面 */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[4.6, 1.75, 0.03]} />
        <meshStandardMaterial color="#F6F2E9" roughness={0.6} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[4.4, 1.65]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      {/* 黄铜细线（生长动画，独立覆盖以便缩放） */}
      <mesh ref={lineRef} position={[0, -0.45, 0.04]}>
        <planeGeometry args={[1.8, 0.025]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      {/* 标题墙上方常亮洗墙灯（常亮主灯之一，gallery.md §4） */}
      <primitive object={washTarget} position={[0, 0, -0.1]} />
      <spotLight
        position={[0, 2.2, 1.1]}
        color="#FFE3C2"
        intensity={2.2}
        angle={0.6}
        penumbra={0.7}
        distance={7}
        decay={1.6}
        target={washTarget}
      />
    </group>
  );
}
