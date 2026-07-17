/**
 * FirstPersonRig.tsx — 第一人称 rig。
 * 眼高 1.62m 头部直驱、无位置阻尼；俯仰 ±80°；滚轮 FOV 70±6 微调。
 * 写相机同样由 CameraDirector 执行，本文件提供位姿计算与 FOV 夹取。
 */
import { CAMERA } from '@/config/site';

export const FIRST_FOV_MIN = CAMERA.first.fov - 6;
export const FIRST_FOV_MAX = CAMERA.first.fov + 6;

export function clampFirstFov(fov: number): number {
  return Math.min(FIRST_FOV_MAX, Math.max(FIRST_FOV_MIN, fov));
}

export default function FirstPersonRig() {
  return null;
}
