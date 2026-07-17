/**
 * GalleryLighting.tsx — 三层照明（gallery.md §4）：
 * 基础 HemisphereLight + 天窗 DirectionalLight（唯一全场投影光）+ 序厅中央 PointLight 补光。
 * 环境反射：drei Environment resolution 64 + 手写 Lightformer（不依赖外部 HDR）。
 * 每帧驱动射灯调度（0.3s 节流）。
 */
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { LIGHTS, PERF } from '@/config/site';
import { useStore, playerRef } from '@/state/store';
import { updateSpotSchedule } from './SpotScheduler';

export default function GalleryLighting() {
  const exhibits = useStore((s) => s.data?.exhibits);
  const dirPos = useMemo(() => [6, 14, 8] as [number, number, number], []);

  useFrame((_, dt) => {
    if (exhibits) updateSpotSchedule(dt, playerRef.x, playerRef.z, exhibits);
  });

  return (
    <group>
      {/* 基础：半球光 */}
      <hemisphereLight args={[LIGHTS.hemiSky, LIGHTS.hemiGround, LIGHTS.hemiIntensity]} />
      {/* 天窗：南向斜射平行光，唯一全场投影 */}
      <directionalLight
        position={dirPos}
        color={LIGHTS.dirColor}
        intensity={LIGHTS.dirIntensity}
        castShadow
        shadow-mapSize={[PERF.dirShadowMap, PERF.dirShadowMap]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-radius={6}
      />
      {/* 序厅中央补光 */}
      <pointLight position={[0, 4.5, 0]} color={LIGHTS.hallPointColor} intensity={LIGHTS.hallPointIntensity} distance={18} decay={2} />
      {/* 环境反射（手写 Lightformer，无外部 HDR） */}
      <Environment resolution={64} frames={1}>
        <color attach="background" args={['#3a372f']} />
        {/* 顶部两条长形暖白（天窗） */}
        <Lightformer intensity={2.2} position={[0, 5, -3]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 1.2, 1]} color="#FFF6E8" />
        <Lightformer intensity={2.2} position={[0, 5, 3]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 1.2, 1]} color="#FFF6E8" />
        {/* 正面弱补光 */}
        <Lightformer intensity={0.5} position={[0, 2, 9]} scale={[12, 4, 1]} color="#F4EEE2" />
      </Environment>
    </group>
  );
}
