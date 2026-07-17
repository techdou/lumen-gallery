/**
 * HintChip.tsx — 聚焦提示 chip（overlay.md §7.2）。
 * 底部居中横排：编号 mono 黄铜 + 作品名衬线 + 作者 + E 键帽「查看」；
 * 移动端键帽替换为「点按查看」。出现 spring，切换聚焦对象内容 crossfade。
 */
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/state/store';
import { KeyCap } from './primitives';

export default function HintChip() {
  const focusedId = useStore((s) => s.focusedId);
  const exhibit = useStore((s) => s.data?.exhibits.find((e) => e.id === s.focusedId));
  const appState = useStore((s) => s.appState);
  const isMobile = useStore((s) => s.isMobile);

  const show = appState === 'explore' && !!focusedId && !!exhibit;
  return (
    <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2" style={{ zIndex: 20 }}>
      <AnimatePresence>
        {show && (
          <motion.div
            key="chip"
            className="flex h-11 items-center gap-2.5 rounded-full px-5"
            style={{ background: 'rgba(20,18,15,.88)', backdropFilter: 'blur(12px)', color: 'var(--paper)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={exhibit!.id}
                className="flex items-center gap-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <span className="font-mono-lumen text-[10px] font-medium" style={{ color: 'var(--brass-bright)' }}>
                  {exhibit!.id}
                </span>
                <span className="font-serif-lumen text-sm">{exhibit!.title}</span>
                {exhibit!.artist && (
                  <span className="text-xs" style={{ color: 'rgba(244,241,234,.6)' }}>
                    {exhibit!.artist}
                  </span>
                )}
                <span style={{ color: 'rgba(244,241,234,.3)' }}>·</span>
                {isMobile ? (
                  <span className="text-[12.5px]" style={{ color: 'var(--brass-bright)' }}>
                    点按查看
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <KeyCap tone="brass">E</KeyCap>
                    <span className="text-[12.5px]">查看</span>
                  </span>
                )}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
