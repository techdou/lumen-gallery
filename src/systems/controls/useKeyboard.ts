/**
 * useKeyboard.ts — 桌面键盘操控（gallery.md §10.1）。
 * WASD/方向键 行走；Shift 疾跑；E 查看聚焦展品；V 视角切换；
 * H/? 帮助；F 全屏；Esc 逐层关闭（lightbox > modal > help）。
 * 非 explore 状态漫游键挂起（Esc/H 仍可用）。
 */
import { useEffect } from 'react';
import { useStore } from '@/state/store';
import { input } from './input';
import { openExhibit } from '@/scene/exhibits/ExhibitRoot';

const MOVE_CODES = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight',
]);

export function useKeyboard() {
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      const st = useStore.getState();
      // 输入框内不拦截
      if ((ev.target as HTMLElement)?.tagName === 'INPUT') return;

      if (ev.code === 'Escape') {
        st.escape();
        return;
      }
      if (ev.code === 'KeyH' || (ev.code === 'Slash' && ev.shiftKey)) {
        if (st.appState === 'explore' || st.appState === 'help') st.toggleHelp();
        return;
      }
      if (ev.code === 'KeyF') {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
        return;
      }
      if (st.appState !== 'explore') return;

      if (MOVE_CODES.has(ev.code)) {
        input.keys.add(ev.code);
        ev.preventDefault();
        return;
      }
      if (ev.code === 'KeyV') {
        st.toggleCameraMode();
        return;
      }
      if (ev.code === 'KeyE' && st.focusedId) {
        const e = st.data?.exhibits.find((x) => x.id === st.focusedId);
        if (e) openExhibit(e);
      }
    };
    const up = (ev: KeyboardEvent) => {
      input.keys.delete(ev.code);
    };
    const blur = () => input.keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);
}
