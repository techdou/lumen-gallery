/**
 * MobileControls.tsx — 移动端操控 UI（overlay.md §8）。
 * 虚拟摇杆视觉（左下动态原点，rAF 直写 transform）+ 聚焦动作键「查看」。
 * 摇杆逻辑在 systems/controls/TouchControls.tsx，本组件只做视觉呈现。
 */
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/state/store';
import { input } from '@/systems/controls/input';
import { openExhibit } from '@/scene/exhibits/ExhibitRoot';

export default function MobileControls() {
  const isMobile = useStore((s) => s.isMobile);
  const appState = useStore((s) => s.appState);
  const focusedId = useStore((s) => s.focusedId);
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  // rAF 直写摇杆位置/缩放（不走 React state）
  useEffect(() => {
    if (!isMobile) return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const j = input.joystick;
      const base = baseRef.current;
      const knob = knobRef.current;
      if (!base || !knob) return;
      if (j.active) {
        base.style.opacity = '1';
        base.style.transform = `translate(${j.ox - 60}px, ${j.oy - 60}px) scale(1)`;
        knob.style.transform = `translate(${j.x * 48 + 32}px, ${j.y * 48 + 32}px)`;
      } else {
        base.style.opacity = '0';
        base.style.transform = 'translate(-200px, -200px) scale(.8)';
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isMobile]);

  if (!isMobile) return null;
  const show = appState === 'explore';

  return (
    <>
      {/* 摇杆底座 + 摇杆头（fixed 定位，rAF 直写） */}
      <div
        ref={baseRef}
        className="pointer-events-none fixed left-0 top-0 z-20 h-[120px] w-[120px] rounded-full border"
        style={{
          background: 'rgba(244,241,234,.4)',
          borderColor: 'var(--line)',
          opacity: 0,
          transition: 'opacity .15s',
        }}
      >
        <div
          ref={knobRef}
          className="absolute h-14 w-14 rounded-full"
          style={{ background: 'rgba(34,31,26,.8)' }}
        />
      </div>
      {/* 聚焦动作键「查看」 */}
      <AnimatePresence>
        {show && focusedId && (
          <motion.button
            key="action"
            type="button"
            className="pointer-events-auto absolute bottom-24 right-4 z-20 flex h-16 w-16 items-center justify-center rounded-full text-[13px] font-semibold"
            style={{ background: 'var(--brass)', color: 'var(--paper)' }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              boxShadow: [
                '0 0 0 0 rgba(166,124,61,.12)',
                '0 0 0 10px rgba(166,124,61,.12)',
                '0 0 0 0 rgba(166,124,61,.12)',
              ],
            }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 24,
              boxShadow: { duration: 2, repeat: Infinity },
            }}
            onClick={() => {
              const st = useStore.getState();
              const e = st.data?.exhibits.find((x) => x.id === st.focusedId);
              if (e) openExhibit(e);
            }}
          >
            查看
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
