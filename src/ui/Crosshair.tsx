/**
 * Crosshair.tsx — 第一人称准星（overlay.md §7.4）。
 * 屏幕中心 6px 黄铜圆点 + 1px 白描边；悬停可交互展品 → 10px 圆环；
 * 打开弹窗时淡出。
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/state/store';

export default function Crosshair() {
  const cameraMode = useStore((s) => s.cameraMode);
  const appState = useStore((s) => s.appState);
  const focusedId = useStore((s) => s.focusedId);
  const show = cameraMode === 'first' && appState === 'explore';

  return (
    <div className="pointer-events-none fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
      <AnimatePresence>
        {show && (
          <motion.div
            key="cross"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="rounded-full"
              animate={{
                width: focusedId ? 10 : 6,
                height: focusedId ? 10 : 6,
                backgroundColor: focusedId ? 'rgba(166,124,61,0)' : 'var(--brass)',
                border: focusedId ? '1.5px solid var(--brass)' : '1px solid rgba(255,255,255,.9)',
              }}
              style={{ translateX: '-50%', translateY: '-50%', position: 'absolute', left: 0, top: 0 }}
              transition={{ duration: 0.15 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
