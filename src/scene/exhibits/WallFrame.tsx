/**
 * WallFrame.tsx — 挂画构件（wall-frame）。
 * 组成：画芯（贴图，微凸墙面 4cm，上沿离墙 2°）+ 三色画框 + 2cm 卡纸内衬
 *      + 右下博物馆标签 + 聚焦暖光洗墙 + 画框描边自发光。
 * 贴图经 Suspense 加载，加载中显示米色卡纸占位。
 */
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { Exhibit } from '@/config/schema';
import { MAT } from '@/config/site';
import { useStore } from '@/state/store';
import { assetUrl } from '@/utils/asset';
import MuseumLabel from './MuseumLabel';

const FRAME_STYLE: Record<string, { color: string; width: number; depth: number; rough: number; metal: number }> = {
  black: { color: MAT.frameBlack, width: 0.04, depth: 0.05, rough: 0.5, metal: 0.1 },
  oak: { color: MAT.frameOak, width: 0.04, depth: 0.05, rough: 0.6, metal: 0 },
  gilt: { color: MAT.frameGilt, width: 0.08, depth: 0.07, rough: 0.38, metal: 0.75 },
  none: { color: MAT.frameBlack, width: 0.02, depth: 0.03, rough: 0.5, metal: 0.1 },
};

/** 画芯（真实贴图） */
function CanvasArt({ e }: { e: Exhibit }) {
  const tex = useTexture(assetUrl(e.src));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return (
    <mesh castShadow>
      <planeGeometry args={[e.size!.w, e.size!.h]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
}

/** 占位画芯（加载中 / 素材缺失） */
function Placeholder({ w, h }: { w: number; h: number }) {
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial color={MAT.matboard} roughness={0.9} />
    </mesh>
  );
}

export default function WallFrame({ exhibit: e }: { exhibit: Exhibit }) {
  const style = FRAME_STYLE[e.frame ?? 'black'] ?? FRAME_STYLE.black;
  const w = e.size?.w ?? 1;
  const h = e.size?.h ?? 0.8;
  const fw = style.width;
  const washRef = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef(0);

  // 画框材质（四边共享；聚焦时 emissive 0→.15 黄铜描边）
  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: style.color,
        roughness: style.rough,
        metalness: style.metal,
        emissive: MAT.brassBright,
        emissiveIntensity: 0,
      }),
    [style],
  );

  // 聚焦态：描边自发光 0→.15、洗墙光 opacity 0→.28（300ms 线性）
  useFrame((_, dt) => {
    const focused = useStore.getState().focusedId === e.id;
    const target = focused ? 1 : 0;
    glow.current += Math.sign(target - glow.current) * Math.min(Math.abs(target - glow.current), dt / 0.3);
    frameMat.emissiveIntensity = 0.15 * glow.current;
    if (washRef.current) washRef.current.opacity = 0.28 * glow.current;
  });

  return (
    // 上沿离墙 2° 的真实挂画俯仰
    <group rotation={[(2 * Math.PI) / 180, 0, 0]}>
      {/* 画框四条边（外扩 fw） */}
      <mesh position={[0, h / 2 + fw / 2, 0]} material={frameMat} castShadow>
        <boxGeometry args={[w + fw * 2, fw, style.depth]} />
      </mesh>
      <mesh position={[0, -h / 2 - fw / 2, 0]} material={frameMat}>
        <boxGeometry args={[w + fw * 2, fw, style.depth]} />
      </mesh>
      <mesh position={[-w / 2 - fw / 2, 0, 0]} material={frameMat}>
        <boxGeometry args={[fw, h, style.depth]} />
      </mesh>
      <mesh position={[w / 2 + fw / 2, 0, 0]} material={frameMat}>
        <boxGeometry args={[fw, h, style.depth]} />
      </mesh>
      {/* 卡纸内衬 2cm */}
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[w + 0.04, h + 0.04]} />
        <meshStandardMaterial color={MAT.matboard} roughness={0.9} />
      </mesh>
      {/* 画芯（微凸墙面） */}
      <group position={[0, 0, 0.012]}>
        <Suspense fallback={<Placeholder w={w} h={h} />}>
          <CanvasArt e={e} />
        </Suspense>
      </group>
      {/* 聚焦暖光洗墙（画框上沿一道渐变） */}
      <mesh position={[0, h / 2 + fw + 0.25, -0.01]}>
        <planeGeometry args={[w + 0.6, 0.5]} />
        <meshBasicMaterial ref={washRef} color="#FFE3C2" transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* 博物馆标签：画框右下侧墙面（换算到绝对高度 1.35m） */}
      <group position={[w / 2 + fw + 0.12, 1.35 - (e.position[1] || 1.55), 0.01]}>
        <MuseumLabel exhibit={e} variant="wall" />
      </group>
    </group>
  );
}
