/**
 * ExhibitSpot.tsx — 单盏展品轨道射灯。
 * 位置：展品朝向反方向 0.9m、贴近该区域顶面下 0.15m（轨道高度）；
 * 参数：3200K #FFE3C2 / angle .42（聚焦收窄 .36）/ penumbra .5 / decay 1.6；
 * 调度：按 SpotScheduler 激活集做 0.4s 淡入淡出；聚焦时 intensity 2.2→3.0；
 * 阴影：仅 C-01/H-01/H-02 三盏（map 512），移动端全关。
 * 入场"开馆"：entering 后按距入口由近及远每 80ms 一盏点亮。
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Exhibit } from '@/config/schema';
import { LIGHTS, PERF } from '@/config/site';
import { useStore } from '@/state/store';
import { activeSpotIds } from './SpotScheduler';

const SHADOW_IDS = new Set(['C-01', 'H-01', 'H-02']);

/** 各区域顶面高 */
function ceilingY(e: Exhibit): number {
  return e.zone === 'hall' ? 5.85 : 4.05;
}

export default function ExhibitSpot({ exhibit: e }: { exhibit: Exhibit }) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const shellRef = useRef<THREE.Group>(null);
  const level = useRef(0); // 0=灭 1=亮（调度淡入淡出）
  const focusK = useRef(0); // 0→1 聚焦插值
  const enterDelay = useRef<number | null>(null);

  // 射灯位置：展品法线反方向 0.9m + 轨道高度；座地展品在斜上方
  const { pos, targetPos } = useMemo(() => {
    const rot = ((e.rotationDeg ?? 0) * Math.PI) / 180;
    const nx = Math.sin(rot);
    const nz = Math.cos(rot);
    const y = ceilingY(e);
    if (e.mount === 'pedestal' || e.mount === 'vitrine') {
      // 座地件：斜前上方
      return {
        pos: new THREE.Vector3(e.position[0] + 0.9, y, e.position[2] + 0.9),
        targetPos: new THREE.Vector3(e.position[0], 1.0, e.position[2]),
      };
    }
    return {
      pos: new THREE.Vector3(e.position[0] + nx * 0.9, y, e.position[2] + nz * 0.9),
      targetPos: new THREE.Vector3(e.position[0], e.position[1], e.position[2]),
    };
  }, [e]);

  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.copy(targetPos);
    return o;
  }, [targetPos]);

  useFrame((_, dt) => {
    const light = lightRef.current;
    if (!light) return;
    const st = useStore.getState();

    // 开馆仪式：entering 期间按距入口 (0,5.2) 距离每 80ms 一盏
    if (enterDelay.current === null) {
      const d = Math.hypot(e.position[0], e.position[2] - 5.2);
      enterDelay.current = d * 0.08;
    }
    const entering = st.appState === 'entering';
    if (entering && enterDelay.current > 0) enterDelay.current -= dt;

    // 调度目标：激活集内（且开馆延迟已过）→ 1，否则 → 0（0.4s 淡入淡出）
    const scheduled = activeSpotIds.has(e.id) && (enterDelay.current ?? 0) <= 0;
    const targetLevel = scheduled ? 1 : 0;
    level.current += Math.sign(targetLevel - level.current) * Math.min(Math.abs(targetLevel - level.current), dt / 0.4);

    // 聚焦插值 300ms
    const focused = st.focusedId === e.id;
    const ft = focused ? 1 : 0;
    focusK.current += Math.sign(ft - focusK.current) * Math.min(Math.abs(ft - focusK.current), dt / 0.3);

    const on = level.current > 0.01;
    light.visible = on;
    if (on) {
      light.intensity =
        level.current * (LIGHTS.spotIntensity + (LIGHTS.spotFocusIntensity - LIGHTS.spotIntensity) * focusK.current);
      light.angle = LIGHTS.spotAngle + (LIGHTS.spotFocusAngle - LIGHTS.spotAngle) * focusK.current;
    }
    // 灯壳前环微亮
    if (shellRef.current) {
      const ring = shellRef.current.children[1] as THREE.Mesh | undefined;
      if (ring) {
        const m = ring.material as THREE.MeshBasicMaterial;
        m.color.set(on ? '#FFE3C2' : '#1D1B18');
      }
    }
  });

  const castShadow = SHADOW_IDS.has(e.id) && !PERF.glassFrosted;
  return (
    <group>
      <primitive object={target} />
      <spotLight
        ref={lightRef}
        position={pos}
        target={target}
        color={LIGHTS.spotColor}
        intensity={0}
        angle={LIGHTS.spotAngle}
        penumbra={LIGHTS.spotPenumbra}
        distance={LIGHTS.spotDistance}
        decay={LIGHTS.spotDecay}
        castShadow={castShadow}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0004}
        visible={false}
      />
      {/* 灯壳：圆柱 Ø9×14cm + 前环 */}
      <group ref={shellRef} position={pos}>
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.14, 12]} />
          <meshStandardMaterial color="#1D1B18" roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.05, 0.05]} rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[0.045, 0.008, 8, 16]} />
          <meshBasicMaterial color="#1D1B18" />
        </mesh>
      </group>
    </group>
  );
}
