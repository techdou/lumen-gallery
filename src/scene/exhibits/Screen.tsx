/**
 * Screen.tsx — 壁挂屏构件（screen，video 展品）。
 * 16:9 屏幕 + 6cm 黑边框贴墙，VideoTexture 静音循环 playsInline；
 * 离屏 >12m pause()；屏下黄铜细线 + mono 编号；聚焦时亮度 +15%（emissive）。
 * 弹窗打开时场景内屏幕暂停（避免音画双源），关闭后从头循环。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Exhibit } from '@/config/schema';
import { MAT } from '@/config/site';
import { useStore, playerRef } from '@/state/store';
import { assetUrl } from '@/utils/asset';

export default function Screen({ exhibit: e }: { exhibit: Exhibit }) {
  const w = e.size?.w ?? 2.4;
  const h = e.size?.h ?? 1.35;
  const [video] = useState(() => {
    const v = document.createElement('video');
    v.src = assetUrl(e.src);
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.crossOrigin = 'anonymous';
    v.preload = 'metadata';
    return v;
  });
  const [tex, setTex] = useState<THREE.VideoTexture | null>(null);
  const [poster, setPoster] = useState<THREE.Texture | null>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef(0);

  // 海报帧
  useEffect(() => {
    let alive = true;
    if (e.poster) {
      new THREE.TextureLoader().load(assetUrl(e.poster), (t) => {
        if (!alive) return;
        t.colorSpace = THREE.SRGBColorSpace;
        setPoster(t);
      });
    }
    return () => { alive = false; };
  }, [e.poster]);

  // 视频就绪后建立 VideoTexture 并播放
  useEffect(() => {
    const onReady = () => {
      const t = new THREE.VideoTexture(video);
      t.colorSpace = THREE.SRGBColorSpace;
      setTex(t);
      video.play().catch(() => undefined);
    };
    if (video.readyState >= 2) onReady();
    else video.addEventListener('loadeddata', onReady, { once: true });
    return () => {
      video.pause();
      video.removeEventListener('loadeddata', onReady);
    };
  }, [video]);

  // 距离管理：>12m 暂停；弹窗打开时暂停、关闭后从头循环
  useFrame((_, dt) => {
    const st = useStore.getState();
    const dx = e.position[0] - playerRef.x;
    const dz = e.position[2] - playerRef.z;
    const far = Math.hypot(dx, dz) > 12;
    if (tex) {
      if (st.appState === 'modal' && st.modalId === e.id) {
        if (!video.paused) video.pause();
      } else if (far) {
        if (!video.paused) video.pause();
      } else if (video.paused) {
        // 从弹窗返回时从头循环
        if (st.modalId === null && video.currentTime > 0.2 && st.appState === 'explore') video.currentTime = 0;
        video.play().catch(() => undefined);
      }
    }
    // 聚焦亮度 +15%
    const focused = st.focusedId === e.id;
    const target = focused ? 1 : 0;
    glow.current += Math.sign(target - glow.current) * Math.min(Math.abs(target - glow.current), dt / 0.3);
    if (matRef.current) matRef.current.emissiveIntensity = 0.5 * (1 + 0.15 * glow.current);
  });

  const screenMap = tex ?? poster;
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: '#000000',
      roughness: 0.4,
      emissive: '#FFFFFF',
      emissiveIntensity: 0.5,
    });
    return m;
  }, []);
  if (screenMap) {
    mat.emissiveMap = screenMap;
    mat.map = screenMap;
    mat.color.set('#FFFFFF');
    mat.needsUpdate = true;
  }

  return (
    <group>
      {/* 黑边框（6cm 宽、8cm 深贴墙） */}
      <mesh position={[0, 0, -0.04]} castShadow>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.08]} />
        <meshStandardMaterial color={MAT.frameBlack} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* 屏幕面 */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[w, h]} />
        <primitive object={mat} ref={matRef} attach="material" />
      </mesh>
      {/* 屏下黄铜细线 + mono 编号（3D 侧以细线呈现，编号见弹窗） */}
      <mesh position={[0, -h / 2 - 0.18, 0.01]}>
        <planeGeometry args={[1.2, 0.02]} />
        <meshBasicMaterial color={MAT.brass} />
      </mesh>
    </group>
  );
}
