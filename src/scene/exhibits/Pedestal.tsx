/**
 * Pedestal.tsx — 展台构件（pedestal，model 展品）。
 * 白立方台座（0.5×0.5×1.05，中央主展台 0.8×0.8×1.1）+ 顶部展品：
 * 有 src → useGLTF 加载（本模板首版不随附 glb）；
 * 无 src → 程序化回退雕塑（球+环+多面体组合的白色抽象雕塑）。
 * spin=true 时绕 Y 自转 0.15 rad/s；假投影 + 台前标签。
 */
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { Exhibit } from '@/config/schema';
import { MAT, PERF } from '@/config/site';
import { shadowBlobTexture } from '@/scene/textures';
import MuseumLabel from './MuseumLabel';
import { assetUrl } from '@/utils/asset';

/** 程序化回退雕塑：三种形态按 id 轮换（球叠环 / 扭曲柱 / 多面体组合） */
function FallbackSculpture({ seed, scale = 1 }: { seed: string; scale?: number }) {
  const variant = useMemo(() => {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return Math.abs(h) % 3;
  }, [seed]);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#EDE9DF', roughness: 0.55, metalness: 0.05 }),
    [],
  );
  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: MAT.brass, roughness: 0.35, metalness: 0.85 }),
    [],
  );
  return (
    <group scale={scale}>
      {variant === 0 && (
        <group>
          <mesh position={[0, 0.32, 0]} material={mat} castShadow>
            <sphereGeometry args={[0.19, 24, 18]} />
          </mesh>
          <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2.4, 0.3, 0]} material={brass}>
            <torusGeometry args={[0.26, 0.02, 12, 48]} />
          </mesh>
          <mesh position={[0, 0.06, 0]} material={mat}>
            <cylinderGeometry args={[0.14, 0.18, 0.12, 24]} />
          </mesh>
        </group>
      )}
      {variant === 1 && (
        <group>
          <mesh position={[0, 0.3, 0]} material={mat} castShadow>
            <icosahedronGeometry args={[0.22, 0]} />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[0.6, 0, Math.PI / 3]} material={brass}>
            <torusGeometry args={[0.28, 0.015, 10, 48]} />
          </mesh>
          <mesh position={[0, 0.05, 0]} material={mat}>
            <boxGeometry args={[0.3, 0.1, 0.3]} />
          </mesh>
        </group>
      )}
      {variant === 2 && (
        <group>
          <mesh position={[0, 0.34, 0]} material={mat} castShadow>
            <torusKnotGeometry args={[0.14, 0.05, 64, 10]} />
          </mesh>
          <mesh position={[0, 0.05, 0]} material={mat}>
            <cylinderGeometry args={[0.16, 0.2, 0.1, 6]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/**
 * glb 展品（有 src 时）。
 * 处理顺序：绕 X 轴旋转矫正（让"躺平"扫描立起）→ 测包围盒 →
 * 按 Y 高度归一化缩放（×modelScale）→ 平移让脚底（minY）对齐 y=0。
 * 这样无论原模型的轴/单位/朝向如何，最终都立在台座顶面、目标高度 targetH。
 */
function GltfModel({
  src,
  targetH,
  modelScale,
  rotationDeg,
}: {
  src: string;
  targetH: number;
  modelScale: number;
  rotationDeg: number;
}) {
  const { scene } = useGLTF(assetUrl(src));
  // 克隆避免污染 drei 的 GLTF 缓存（同一 src 被多个展品复用时）
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const { scale, footY } = useMemo(() => {
    const rx = (rotationDeg * Math.PI) / 180;
    // 应用 X 轴矫正后再测包围盒（临时 parent 让旋转生效）
    const pivot = new THREE.Object3D();
    pivot.rotation.x = rx;
    pivot.add(cloned);
    cloned.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const h = Math.max(size.y, 0.001);
    const s = (targetH / h) * modelScale;
    // 脚底对齐：把 minY 缩放后的偏移上提
    return { scale: s, footY: -box.min.y * s };
  }, [cloned, rotationDeg, targetH, modelScale]);
  return (
    <group rotation={[(rotationDeg * Math.PI) / 180, 0, 0]} position={[0, footY, 0]} scale={scale}>
      <primitive object={cloned} castShadow />
    </group>
  );
}

export default function Pedestal({ exhibit: e, big = false }: { exhibit: Exhibit; big?: boolean }) {
  const blob = useMemo(() => shadowBlobTexture(), []);
  const spinRef = useRef<THREE.Group>(null);
  const size = big ? 0.8 : 0.5;
  const height = big ? 1.1 : 1.05;
  const targetH = big ? 1.0 : 0.62;

  useFrame((_, dt) => {
    if (e.spin && spinRef.current) spinRef.current.rotation.y += dt * 0.15;
  });

  return (
    <group>
      {/* 台座 */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[size, height, size]} />
        <meshStandardMaterial color={MAT.pedestal} roughness={0.85} />
      </mesh>
      {/* 假投影 */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 1.8, size * 1.8]} />
        <meshBasicMaterial map={blob} transparent depthWrite={false} opacity={PERF.glassFrosted ? 0.9 : 1} />
      </mesh>
      {/* 展品（自转组） */}
      <group ref={spinRef} position={[0, height, 0]}>
        {e.src ? (
          <Suspense fallback={<FallbackSculpture seed={e.id} scale={targetH / 0.64} />}>
            <GltfModel
              src={e.src}
              targetH={targetH}
              modelScale={e.modelScale ?? 1}
              rotationDeg={e.modelRotationDeg ?? 0}
            />
          </Suspense>
        ) : (
          <FallbackSculpture seed={e.id} scale={targetH / 0.64} />
        )}
      </group>
      {/* 台前地面标签 */}
      <MuseumLabel exhibit={e} variant="floor" />
    </group>
  );
}
