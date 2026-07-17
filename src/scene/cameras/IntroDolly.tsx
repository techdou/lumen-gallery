/**
 * IntroDolly.tsx — 入场运镜（gallery.md §14）。
 * 相机从入口上方 (0, 3.4, 9.5) 看向 (0,1.5,-2) → 2.8s easeInOutCubic
 * 滑至第三人称默认位（角色身后 3.4m）。运镜期间屏蔽输入，结束后 HUD 入场。
 */
import * as THREE from 'three';
import { CAMERA, PERF } from '@/config/site';
import { easeInOutCubic, makePose, type Pose } from './rigMath';
import { thirdPersonPose } from './rigMath';

export const INTRO_DURATION = 2.8;

const START = makePose(new THREE.Vector3(0, 3.4, 9.5), new THREE.Vector3(0, 1.5, -2), CAMERA.third.fov);

/** 计算 t∈[0,1] 时刻的运镜位姿 */
export function introPose(t: number, spawnX: number, spawnZ: number, yaw: number): Pose {
  const k = easeInOutCubic(Math.min(1, Math.max(0, t)));
  const end = thirdPersonPose(spawnX, spawnZ, yaw, 0.12, CAMERA.third.distance, 1);
  const pos = START.pos.clone().lerp(end.pos, k);
  const quat = START.quat.clone().slerp(end.quat, k);
  return { pos, quat, fov: CAMERA.third.fov };
}

/** 雾密度入场缓动：0.02 → 目标（桌面 .008 / 移动 .012），2s */
export function introFogDensity(t: number): number {
  const target = PERF.fogDensity;
  const k = 1 - Math.pow(1 - Math.min(1, t / 2), 3);
  return 0.02 + (target - 0.02) * k;
}

export default function IntroDolly() {
  return null;
}
