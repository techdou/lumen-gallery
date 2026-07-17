/**
 * ZoneLabel.tsx — 当前展区名（overlay.md §5）。
 * 黄铜小方块前缀 + 衬线中文名 + mono 英文副行；
 * 区域变化：旧名 y-8 淡出 .25s → 新名 y+8 淡入 .4s。
 */
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/state/store';

export default function ZoneLabel() {
  const zoneId = useStore((s) => s.zone);
  const zone = useStore((s) => s.data?.zones.find((z) => z.id === s.zone));

  return (
    <motion.div
      className="absolute left-4 top-[68px] flex items-start gap-2.5"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 28, delay: 0.16 }}
    >
      <motion.span
        key={`sq-${zoneId}`}
        className="mt-2 block h-2 w-2"
        style={{ background: 'var(--brass)' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: [0, 1.3, 1] }}
        transition={{ duration: 0.35 }}
      />
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={zoneId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="font-serif-lumen text-[20px] font-medium leading-[1.3]">
              {zone?.name ?? ''}
            </div>
            <div
              className="font-mono-lumen mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: 'var(--stone)' }}
            >
              {zone?.nameEn ?? ''}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
