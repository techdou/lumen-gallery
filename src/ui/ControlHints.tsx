/**
 * ControlHints.tsx — 桌面操作提示（overlay.md §7.1）。
 * 右下单行键帽提示；进入探索 8s 后自动收起为「?」圆形按钮（hover 展开）。
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyCap } from './primitives';
import { useStore } from '@/state/store';

const HINTS: [string, string][] = [
  ['WASD', '移动'],
  ['Shift', '疾跑'],
  ['拖拽/点击锁定', '视角'],
  ['滚轮', '缩放'],
  ['E', '查看'],
  ['V', '视角'],
  ['H', '帮助'],
];

export default function ControlHints() {
  const [collapsed, setCollapsed] = useState(false);
  const [hover, setHover] = useState(false);
  const appState = useStore((s) => s.appState);

  useEffect(() => {
    if (appState !== 'explore') return;
    const t = setTimeout(() => setCollapsed(true), 8000);
    return () => clearTimeout(t);
  }, [appState]);

  if (appState !== 'explore') return null;
  const showFull = !collapsed || hover;

  return (
    <motion.div
      className="pointer-events-auto absolute bottom-4 right-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.32, duration: 0.45 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <AnimatePresence mode="wait">
        {showFull ? (
          <motion.div
            key="full"
            className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 rounded-[14px] border px-4 py-2.5"
            style={{ background: 'rgba(244,241,234,.92)', backdropFilter: 'blur(12px)', borderColor: 'var(--line)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {HINTS.map(([k, label]) => (
              <span key={k} className="flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-60)' }}>
                <KeyCap>{k}</KeyCap>
                {label}
              </span>
            ))}
          </motion.div>
        ) : (
          <motion.button
            key="dot"
            type="button"
            aria-label="操作提示"
            className="flex h-10 w-10 items-center justify-center rounded-full border font-serif-lumen"
            style={{ background: 'rgba(244,241,234,.92)', borderColor: 'var(--line)', color: 'var(--ink-60)' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => useStore.getState().openHelp()}
          >
            ?
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
