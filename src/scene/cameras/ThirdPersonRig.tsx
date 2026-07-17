/**
 * ThirdPersonRig.tsx — 第三人称 rig（默认）。
 * 位姿由 rigMath.thirdPersonPose 给出；本组件负责每帧避障比例的平滑（lerp .15 防弹跳）。
 * 实际写相机由 CameraDirector 统一执行（保证模式切换/运镜时的连续性）。
 */
import { useFrame } from '@react-three/fiber';
import { castSegment } from '@/systems/collision';
import { CAMERA } from '@/config/site';
import { playerRef } from '@/state/store';
import { lookDir } from './rigMath';

/** 每帧更新第三人称避障比例（写入 hitTRef 供 CameraDirector 使用） */
export function useThirdPersonObstacle(hitTRef: { current: number }) {
  useFrame(() => {
    const d = lookDir(playerRef.camYaw, playerRef.camPitch);
    const ax = playerRef.x;
    const az = playerRef.z;
    // 从锚点向后投射
    const dist = playerRef.camDistance;
    const tx = ax - d.x * dist;
    const tz = az - d.z * dist;
    const t = castSegment(ax, az, tx, tz, CAMERA.obstacleRadius);
    // 恢复时 lerp .15 防弹跳；命中时立即收紧
    hitTRef.current = t < hitTRef.current ? t : hitTRef.current + (t - hitTRef.current) * 0.15;
  });
}

export default function ThirdPersonRig({ hitTRef }: { hitTRef: { current: number } }) {
  useThirdPersonObstacle(hitTRef);
  return null;
}
