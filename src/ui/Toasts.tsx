/**
 * Toasts.tsx — 辅助提示层（overlay.md §12，z 30）：
 * 1. Esc 提示（指针锁定后 2.5s 淡出，sessionStorage 记忆只显示一次）；
 * 2. 横屏建议（移动端竖屏首次进入，5s 自动消失）；
 * 3. 锁定丢失提示（第一人称未锁定 >6s：「点击画面锁定视角」）。
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore } from '@/state/store';

function useSessionFlag(key: string): [boolean, () => void] {
  const [flag, setFlag] = useState(() => sessionStorage.getItem(key) === '1');
  return [
    flag,
    () => {
      sessionStorage.setItem(key, '1');
      setFlag(true);
    },
  ];
}

export default function Toasts() {
  const appState = useStore((s) => s.appState);
  const pointerLocked = useStore((s) => s.pointerLocked);
  const cameraMode = useStore((s) => s.cameraMode);
  const isMobile = useStore((s) => s.isMobile);
  const [escShown, markEscShown] = useSessionFlag('lumen-esc-hint');
  const [escVisible, setEscVisible] = useState(false);
  const [landscapeShown, markLandscapeShown] = useSessionFlag('lumen-landscape');
  const [landscapeVisible, setLandscapeVisible] = useState(false);
  const [lockHint, setLockHint] = useState(false);

  // Esc 提示：锁定成功后 2.5s
  useEffect(() => {
    if (pointerLocked && !escShown) {
      setEscVisible(true);
      const t = setTimeout(() => {
        setEscVisible(false);
        markEscShown();
      }, 2500);
      return () => clearTimeout(t);
    }
    setEscVisible(false);
    return undefined;
  }, [pointerLocked, escShown, markEscShown]);

  // 横屏建议：移动端竖屏首次进入
  useEffect(() => {
    if (appState === 'explore' && isMobile && !landscapeShown && window.innerHeight > window.innerWidth) {
      setLandscapeVisible(true);
      const t = setTimeout(() => {
        setLandscapeVisible(false);
        markLandscapeShown();
      }, 5000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [appState, isMobile, landscapeShown, markLandscapeShown]);

  // 锁定丢失提示（第一人称、探索态、未锁定 >6s）
  useEffect(() => {
    if (appState === 'explore' && cameraMode === 'first' && !pointerLocked && !isMobile) {
      const t = setTimeout(() => setLockHint(true), 6000);
      return () => clearTimeout(t);
    }
    setLockHint(false);
    return undefined;
  }, [appState, cameraMode, pointerLocked, isMobile]);

  useEffect(() => {
    if (pointerLocked) setLockHint(false);
  }, [pointerLocked]);

  const toastClass = 'flex h-9 items-center gap-2 rounded-full px-4 text-[12.5px]';
  const toastStyle = { background: 'rgba(20,18,15,.88)', color: 'var(--paper)', backdropFilter: 'blur(12px)' } as const;

  return (
    <>
      {/* 横屏建议（顶部） */}
      <div className="pointer-events-none fixed left-1/2 top-4 z-30 -translate-x-1/2">
        <AnimatePresence>
          {landscapeVisible && (
            <motion.div
              className={toastClass}
              style={{ ...toastStyle, pointerEvents: 'auto' }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              旋转设备，横屏体验更佳
              <button type="button" aria-label="关闭提示" onClick={() => { setLandscapeVisible(false); markLandscapeShown(); }}>
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Esc / 锁定提示（底部居中） */}
      <div className="pointer-events-none fixed bottom-20 left-1/2 z-30 -translate-x-1/2">
        <AnimatePresence>
          {escVisible && (
            <motion.div
              key="esc"
              className={toastClass}
              style={toastStyle}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
            >
              移动鼠标环视 · Esc 释放鼠标
            </motion.div>
          )}
          {lockHint && !escVisible && (
            <motion.div
              key="lock"
              className={toastClass}
              style={toastStyle}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
            >
              点击画面锁定视角
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
