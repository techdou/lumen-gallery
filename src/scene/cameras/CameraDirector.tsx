/**
 * CameraDirector.tsx — 相机总指挥：
 * 1. entering：IntroDolly 入场运镜（2.8s easeInOutCubic）；
 * 2. explore：第三/第一人称阻尼跟随（位置 lerp .12/帧，FOV 55/70）；
 * 3. 模式切换：0.6s easeInOutCubic 插值位置与 FOV，yaw/pitch 连续不晕眩；
 * 4. 聚焦运镜（playerRef.focusMove）：0.8s 把玩家滑到观赏位并转对展品；
 * 5. 疾跑 FOV +3（0.3s）。
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CAMERA } from '@/config/site';
import { useStore, playerRef } from '@/state/store';
import { input } from '@/systems/controls/input';
import { thirdPersonPose, firstPersonPose, easeInOutCubic, type Pose } from './rigMath';
import { introPose, INTRO_DURATION } from './IntroDolly';
import ThirdPersonRig from './ThirdPersonRig';

export default function CameraDirector() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const cameraMode = useStore((s) => s.cameraMode);
  const hitTRef = useRef(1);
  const focusStart = useRef<{ sx: number; sz: number; syaw: number } | null>(null);
  const introT = useRef(0);
  const blend = useRef<{ from: Pose; t: number } | null>(null);
  const fovKick = useRef(0);
  const curPos = useRef(new THREE.Vector3(0, 3.4, 9.5));
  const curQuat = useRef(new THREE.Quaternion());
  const curFov = useRef<number>(CAMERA.third.fov);
  const prevMode = useRef(cameraMode);

  // 模式切换：捕获当前位姿，0.6s 混合
  useEffect(() => {
    if (prevMode.current !== cameraMode) {
      blend.current = {
        from: { pos: curPos.current.clone(), quat: curQuat.current.clone(), fov: curFov.current },
        t: 0,
      };
      prevMode.current = cameraMode;
    }
  }, [cameraMode]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = useStore.getState();
    const appState = st.appState;

    // ---- 聚焦运镜：0.8s 内把玩家位置/朝向滑到观赏位 ----
    if (playerRef.focusMove) {
      const fm = playerRef.focusMove;
      fm.t = Math.min(1, fm.t + dt / 0.8);
      const k = easeInOutCubic(fm.t);
      // 起点快照存于首次执行
      if (!focusStart.current) {
        focusStart.current = { sx: playerRef.x, sz: playerRef.z, syaw: playerRef.camYaw };
      }
      const fmx = focusStart.current;
      playerRef.x = THREE.MathUtils.lerp(fmx.sx, fm.x, k);
      playerRef.z = THREE.MathUtils.lerp(fmx.sz, fm.z, k);
      // 朝向：面向展品
      const targetYaw = Math.atan2(fm.lookX - fm.x, fm.lookZ - fm.z);
      let dy = targetYaw - fmx.syaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      playerRef.camYaw = fmx.syaw + dy * k;
      playerRef.yaw = playerRef.camYaw;
      if (fm.t >= 1) {
        playerRef.focusMove = null;
        focusStart.current = null;
      }
    }

    // ---- 入场运镜 ----
    if (appState === 'entering') {
      introT.current = Math.min(INTRO_DURATION, introT.current + dt);
      const pose = introPose(introT.current / INTRO_DURATION, playerRef.x, playerRef.z, Math.PI);
      applyPose(pose, 1);
      if (introT.current >= INTRO_DURATION) st.finishEntering();
      return;
    }
    if (appState === 'loading' || appState === 'ready') {
      // 加载期间相机停在入口上方
      const pose = introPose(0, playerRef.x, playerRef.z, Math.PI);
      applyPose(pose, 1);
      return;
    }

    // ---- 正常跟随 ----
    const yaw = playerRef.camYaw;
    const pitch = playerRef.camPitch;
    const pose =
      cameraMode === 'third'
        ? thirdPersonPose(playerRef.x, playerRef.z, yaw, pitch, playerRef.camDistance, hitTRef.current)
        : firstPersonPose(playerRef.x, playerRef.z, yaw, pitch);
    // 第一人称滚轮/捏合 FOV 微调（70±6）
    if (cameraMode === 'first') pose.fov += input.fovAdjust.current;

    // 疾跑 FOV +3（0.3s）
    const kickTarget = playerRef.running && playerRef.speed > 1 ? 3 : 0;
    fovKick.current += Math.sign(kickTarget - fovKick.current) * Math.min(Math.abs(kickTarget - fovKick.current), (dt / 0.3) * 3);
    pose.fov += fovKick.current;

    // 模式切换混合
    if (blend.current) {
      blend.current.t = Math.min(1, blend.current.t + dt / 0.6);
      const k = easeInOutCubic(blend.current.t);
      pose.pos.lerpVectors(blend.current.from.pos, pose.pos, k);
      pose.quat.slerpQuaternions(blend.current.from.quat, pose.quat, k);
      pose.fov = THREE.MathUtils.lerp(blend.current.from.fov, pose.fov, k);
      if (blend.current.t >= 1) blend.current = null;
      applyPose(pose, 1);
      return;
    }

    // 第三人称位置阻尼 lerp .12；第一人称直驱
    const lerpK = cameraMode === 'third' ? 1 - Math.pow(1 - CAMERA.third.posLerp, dt * 60) : 1;
    applyPose(pose, lerpK);
  });

  function applyPose(pose: Pose, posLerp: number) {
    curPos.current.lerp(pose.pos, posLerp);
    curQuat.current.slerp(pose.quat, Math.min(1, posLerp * 2));
    curFov.current = THREE.MathUtils.lerp(curFov.current, pose.fov, Math.min(1, posLerp * 2));
    camera.position.copy(curPos.current);
    camera.quaternion.copy(curQuat.current);
    if (Math.abs(camera.fov - curFov.current) > 0.01) {
      camera.fov = curFov.current;
      camera.updateProjectionMatrix();
    }
  }

  return <ThirdPersonRig hitTRef={hitTRef} />;
}
