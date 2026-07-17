/**
 * rigMath.ts — 相机 rig 共用数学工具。
 * yaw/pitch → 视线方向；easeInOutCubic；第三/第一人称位姿计算。
 */
import * as THREE from 'three';
import { CAMERA } from '@/config/site';

/** easeInOutCubic（相机叙事运动唯一缓动） */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** yaw（0=面向+Z）/pitch → 单位视线方向 */
export function lookDir(yaw: number, pitch: number, out = new THREE.Vector3()): THREE.Vector3 {
  const cp = Math.cos(pitch);
  return out.set(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp);
}

/**
 * yaw → 右向量。
 * forward = (sinθ, 0, cosθ)（lookDir，0=面向+Z），右手系下
 * right = forward × up = (-cosθ, 0, sinθ)。
 */
export function rightDir(yaw: number, out = new THREE.Vector3()): THREE.Vector3 {
  return out.set(-Math.cos(yaw), 0, Math.sin(yaw));
}

export interface Pose {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  fov: number;
}

const _m = new THREE.Matrix4();
const _eye = new THREE.Vector3();
const _look = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/** 由 eye/lookAt/fov 构造 Pose */
export function makePose(eye: THREE.Vector3, look: THREE.Vector3, fov: number): Pose {
  _m.lookAt(eye, look, _up);
  return { pos: eye.clone(), quat: new THREE.Quaternion().setFromRotationMatrix(_m), fov };
}

/**
 * 第三人称位姿（gallery.md §9）：
 * 锚点 = 角色头顶 1.55m，后撤 distance，肩偏 +0.35m；
 * 相机避障：锚点→相机 spherecast（r .25），命中收至 ×0.85，下限 0.6m。
 */
export function thirdPersonPose(
  px: number, pz: number, yaw: number, pitch: number, distance: number,
  hitT: number, // 0..1 避障比例（由 castSegment 得）
): Pose {
  const d = lookDir(yaw, pitch);
  const right = rightDir(yaw);
  const effDist = Math.max(CAMERA.minHitDistance, distance * hitT * (hitT < 1 ? 0.85 : 1));
  _eye.set(px, CAMERA.third.anchorHeight, pz)
    .addScaledVector(d, -effDist)
    .addScaledVector(right, CAMERA.third.shoulder);
  _look.set(px, CAMERA.third.anchorHeight, pz).addScaledVector(d, 2.0);
  return makePose(_eye, _look, CAMERA.third.fov);
}

/** 第一人称位姿：角色头内，眼高 1.62m */
export function firstPersonPose(px: number, pz: number, yaw: number, pitch: number): Pose {
  const d = lookDir(yaw, pitch);
  _eye.set(px, CAMERA.first.eyeHeight, pz);
  _look.copy(_eye).addScaledVector(d, 2.0);
  return makePose(_eye, _look, CAMERA.first.fov);
}
