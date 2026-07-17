/**
 * TouchControls.tsx — 移动端触屏操控（gallery.md §10.2）。
 * - 左下 40% 屏区按下：动态原点虚拟摇杆（最大半径 48px，模长>0.85=疾跑）；
 * - 右侧 60% 单指拖拽：旋转视角 0.004 rad/px；
 * - 双指捏合：第三人称推拉距离 / 第一人称 FOV；
 * - 点按（<250ms 且位移 <10px）：射线命中展品直接打开详情。
 */
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { CAMERA } from '@/config/site';
import { useStore, playerRef } from '@/state/store';
import { input } from './input';
import { clampFirstFov } from '@/scene/cameras/FirstPersonRig';

const JOY_MAX = 48; // px
const DEAD = 8; // 死区 px

export default function TouchControls() {
  const gl = useThree((s) => s.gl);
  const lookId = useRef(-1);
  const lookLast = useRef({ x: 0, y: 0 });
  const tap = useRef<{ x: number; y: number; t: number } | null>(null);
  const pinch = useRef<{ id0: number; id1: number; d0: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    const st = () => useStore.getState();

    const onStart = (ev: TouchEvent) => {
      if (st().appState !== 'explore') return;
      const w = window.innerWidth;
      for (const t of Array.from(ev.changedTouches)) {
        if (t.clientX < w * 0.4 && !input.joystick.active) {
          // 左下：动态原点摇杆
          input.joystick.active = true;
          input.joystick.id = t.identifier;
          input.joystick.ox = t.clientX;
          input.joystick.oy = t.clientY;
          input.joystick.x = 0;
          input.joystick.y = 0;
        } else if (lookId.current === -1 && pinch.current === null) {
          // 右侧：视角拖拽（同时记录点按候选）
          lookId.current = t.identifier;
          lookLast.current = { x: t.clientX, y: t.clientY };
          tap.current = { x: t.clientX, y: t.clientY, t: performance.now() };
        }
        // 双指捏合检测
        if (ev.touches.length >= 2 && pinch.current === null) {
          const [a, b] = [ev.touches[0], ev.touches[1]];
          pinch.current = {
            id0: a.identifier,
            id1: b.identifier,
            d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
          };
          lookId.current = -1;
          tap.current = null;
        }
      }
    };
    const onMove = (ev: TouchEvent) => {
      if (st().appState !== 'explore') return;
      ev.preventDefault();
      // 捏合
      if (pinch.current && ev.touches.length >= 2) {
        const a = Array.from(ev.touches).find((t) => t.identifier === pinch.current!.id0);
        const b = Array.from(ev.touches).find((t) => t.identifier === pinch.current!.id1);
        if (a && b) {
          const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          const ratio = d / Math.max(1, pinch.current.d0);
          pinch.current.d0 = d;
          if (st().cameraMode === 'third') {
            playerRef.camDistance = Math.min(
              CAMERA.third.maxDistance,
              Math.max(CAMERA.third.minDistance, playerRef.camDistance / ratio),
            );
          } else {
            input.fovAdjust.current = clampFirstFov(
              CAMERA.first.fov + input.fovAdjust.current + (ratio - 1) * 30,
            ) - CAMERA.first.fov;
          }
        }
        return;
      }
      for (const t of Array.from(ev.changedTouches)) {
        if (input.joystick.active && t.identifier === input.joystick.id) {
          // 摇杆向量（死区 8px，半径 48px）
          let dx = t.clientX - input.joystick.ox;
          let dy = t.clientY - input.joystick.oy;
          const len = Math.hypot(dx, dy);
          if (len > JOY_MAX) {
            dx = (dx / len) * JOY_MAX;
            dy = (dy / len) * JOY_MAX;
          }
          if (len < DEAD) {
            input.joystick.x = 0;
            input.joystick.y = 0;
          } else {
            input.joystick.x = dx / JOY_MAX;
            input.joystick.y = dy / JOY_MAX;
          }
        } else if (t.identifier === lookId.current) {
          const dx = t.clientX - lookLast.current.x;
          const dy = t.clientY - lookLast.current.y;
          lookLast.current = { x: t.clientX, y: t.clientY };
          playerRef.camYaw -= dx * CAMERA.sensTouch;
          const first = st().cameraMode === 'first';
          const lim = first ? CAMERA.first : CAMERA.third;
          playerRef.camPitch = Math.min(
            lim.pitchMax,
            Math.max(lim.pitchMin, playerRef.camPitch - dy * CAMERA.sensTouch),
          );
          if (tap.current && Math.hypot(t.clientX - tap.current.x, t.clientY - tap.current.y) > 10) {
            tap.current = null;
          }
        }
      }
    };
    const onEnd = (ev: TouchEvent) => {
      for (const t of Array.from(ev.changedTouches)) {
        if (input.joystick.active && t.identifier === input.joystick.id) {
          input.joystick.active = false;
          input.joystick.id = -1;
          input.joystick.x = 0;
          input.joystick.y = 0;
        }
        if (t.identifier === lookId.current) {
          lookId.current = -1;
          // 点按：射线命中展品直接打开
          if (tap.current && performance.now() - tap.current.t < 250 && st().appState === 'explore') {
            const nx = (t.clientX / window.innerWidth) * 2 - 1;
            const ny = -(t.clientY / window.innerHeight) * 2 + 1;
            input.tapHandler?.(nx, ny);
          }
          tap.current = null;
        }
        if (pinch.current && (t.identifier === pinch.current.id0 || t.identifier === pinch.current.id1)) {
          pinch.current = null;
        }
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [gl]);

  return null;
}
