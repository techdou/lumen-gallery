/**
 * Gallery.tsx — 场景根：Canvas、色调映射（ACES Filmic, exposure 1.05）、
 * 雾（FogExp2 #F4F1EA，入场 0.02→0.008 缓动 2s）、Suspense、CSS 暗角、
 * 弹窗打开时降帧 30fps（frameloop="never" + 手动 advance 节流）。
 */
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MAT, PERF } from '@/config/site';
import { useStore, playerRef } from '@/state/store';
import { registerObstacles, clearObstacles, buildArchitectureObstacles } from '@/systems/collision';
import Walls from './architecture/Walls';
import Floor from './architecture/Floor';
import Ceiling from './architecture/Ceiling';
import TrackRails from './architecture/TrackRails';
import TitleWall from './architecture/TitleWall';
import ExhibitRoot from './exhibits/ExhibitRoot';
import GalleryLighting from './lighting/GalleryLighting';
import Avatar from './Avatar';
import CameraDirector from './cameras/CameraDirector';
import { introFogDensity } from './cameras/IntroDolly';
import PlayerController from '@/systems/PlayerController';
import PointerLook from '@/systems/controls/PointerLook';
import TouchControls from '@/systems/controls/TouchControls';

/**
 * 手动帧驱动：frameloop="never" 下用 rAF 调 advance；
 * 弹窗/灯箱/帮助打开时按 30fps 节流（0.2s 内无感），探索态满帧。
 */
function FrameDriver() {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const st = useStore.getState().appState;
      const degraded = st !== 'explore' && st !== 'entering';
      if (degraded && t - last < 1000 / PERF.degradedFps) return;
      last = t;
      advance(t);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [advance]);
  return null;
}

/** 雾与背景（入场时雾密度 0.02→目标缓动 2s，像眼睛适应展厅） */
function Atmosphere() {
  const scene = useThree((s) => s.scene);
  const fog = useMemo(() => new THREE.FogExp2(MAT.fog, 0.02), []);
  const t = useRef(0);
  useEffect(() => {
    scene.fog = fog;
    scene.background = new THREE.Color(MAT.fog);
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);
  useFrame((_, dt) => {
    const st = useStore.getState().appState;
    if (st === 'entering' && t.current < 2) {
      t.current += dt;
      fog.density = introFogDensity(t.current);
    } else if (st !== 'loading' && st !== 'ready') {
      fog.density = PERF.fogDensity;
    }
  });
  return null;
}

/** 场景内容（数据就绪后渲染） */
function GalleryScene() {
  const exhibits = useStore((s) => s.data?.exhibits);
  // 注册碰撞障碍（墙体 + 座地）
  useEffect(() => {
    clearObstacles();
    registerObstacles(buildArchitectureObstacles());
    return () => clearObstacles();
  }, []);

  if (!exhibits) return null;
  return (
    <group>
      <Floor />
      <Walls />
      <Ceiling />
      <TrackRails />
      <TitleWall />
      {exhibits.map((e) => (
        <ExhibitRoot key={e.id} exhibit={e} />
      ))}
      <Avatar />
      <GalleryLighting />
    </group>
  );
}

// 低性能模式：URL 带 ?lowspec=1 时关阴影、降渲染分辨率、关抗锯齿。
// 用途：性能极弱的设备（或自动化冒烟测试环境）兜底；正常访客无需使用。
const LOWSPEC =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('lowspec');

export default function Gallery() {
  // 出生点写入 playerRef（数据加载后由 App 调用过一次；此处兜底）
  const data = useStore((s) => s.data);
  useEffect(() => {
    if (!data) return;
    const [x, , z] = data.gallery.spawn.position;
    playerRef.x = x;
    playerRef.z = z;
    playerRef.yaw = (data.gallery.spawn.headingDeg * Math.PI) / 180;
    playerRef.camYaw = playerRef.yaw;
    playerRef.camPitch = 0.12;
  }, [data]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}>
      <Canvas
        frameloop="never"
        shadows={!LOWSPEC}
        dpr={LOWSPEC ? 0.5 : PERF.pixelRatio}
        gl={{
          antialias: !LOWSPEC,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ fov: 55, near: 0.05, far: 90, position: [0, 3.4, 9.5] }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', touchAction: 'none' }}
      >
        <FrameDriver />
        <Atmosphere />
        <Suspense fallback={null}>
          <GalleryScene />
        </Suspense>
        <CameraDirector />
        <PlayerController />
        <PointerLook />
        <TouchControls />
      </Canvas>
      {/* CSS 暗角（视觉聚焦画面中心，无后处理链） */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(120% 90% at 50% 45%, transparent 62%, rgba(34,31,26,.14) 100%)',
        }}
      />
    </div>
  );
}
