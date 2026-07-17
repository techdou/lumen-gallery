/**
 * PointerLook.tsx — 桌面鼠标视角（gallery.md §10.1）。
 * - 左键拖拽（未锁定）：旋转视角 0.0042 rad/px，拖拽中 cursor grabbing；
 * - 点击空白画布：请求 Pointer Lock（锁定后 0.0023 rad/px，Esc 释放）；
 * - 滚轮：第三人称推拉 1.6–6m / 第一人称 FOV 70±6；
 * - 非 explore 状态：主动退出锁定并挂起。
 */
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { CAMERA } from '@/config/site';
import { useStore, playerRef } from '@/state/store';
import { input } from './input';
import { lastExhibitClickAt } from '@/scene/exhibits/ExhibitRoot';
import { clampFirstFov } from '@/scene/cameras/FirstPersonRig';

function clampPitch(p: number, first: boolean): number {
  const lim = first ? CAMERA.first : CAMERA.third;
  return Math.min(lim.pitchMax, Math.max(lim.pitchMin, p));
}

export default function PointerLook() {
  const gl = useThree((s) => s.gl);
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    const st = () => useStore.getState();

    const onDown = (ev: PointerEvent) => {
      if (ev.button !== 0) return;
      drag.current = { x: ev.clientX, y: ev.clientY, moved: 0 };
    };
    const onMove = (ev: PointerEvent) => {
      const first = st().cameraMode === 'first';
      if (document.pointerLockElement === el) {
        // 指针锁定自由视角
        if (st().appState !== 'explore') return;
        playerRef.camYaw -= ev.movementX * CAMERA.sensLock;
        playerRef.camPitch = clampPitch(playerRef.camPitch - ev.movementY * CAMERA.sensLock, first);
        return;
      }
      if (!drag.current || st().appState !== 'explore') return;
      const dx = ev.clientX - drag.current.x;
      const dy = ev.clientY - drag.current.y;
      drag.current.x = ev.clientX;
      drag.current.y = ev.clientY;
      drag.current.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.current.moved > 4) {
        playerRef.camYaw -= dx * CAMERA.sensDrag;
        playerRef.camPitch = clampPitch(playerRef.camPitch - dy * CAMERA.sensDrag, first);
        el.style.cursor = 'grabbing';
      }
    };
    const onUp = () => {
      const wasClick = drag.current && drag.current.moved <= 4;
      drag.current = null;
      el.style.cursor = 'default';
      // 点击空白处（非展品）→ 请求指针锁定
      if (
        wasClick &&
        st().appState === 'explore' &&
        document.pointerLockElement !== el &&
        Date.now() - lastExhibitClickAt > 150
      ) {
        el.requestPointerLock?.();
      }
    };
    const onLockChange = () => {
      st().setPointerLocked(document.pointerLockElement === el);
    };
    const onWheel = (ev: WheelEvent) => {
      if (st().appState !== 'explore') return;
      ev.preventDefault();
      const dir = ev.deltaY > 0 ? 1 : -1;
      if (st().cameraMode === 'third') {
        playerRef.camDistance = Math.min(
          CAMERA.third.maxDistance,
          Math.max(CAMERA.third.minDistance, playerRef.camDistance * (1 + dir * 0.08)),
        );
      } else {
        input.fovAdjust.current = clampFirstFov(CAMERA.first.fov + input.fovAdjust.current - dir * 1.5) - CAMERA.first.fov;
      }
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerlockchange', onLockChange);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerlockchange', onLockChange);
      el.removeEventListener('wheel', onWheel);
    };
  }, [gl]);

  // 非 explore 状态主动退出指针锁定
  const appState = useStore((s) => s.appState);
  useEffect(() => {
    if (appState !== 'explore' && document.pointerLockElement === gl.domElement) {
      document.exitPointerLock();
    }
  }, [appState, gl]);

  return null;
}
