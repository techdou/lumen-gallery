/**
 * primitives.tsx — 共用 UI 元件（overlay.md §13）：
 * IconButton / Button（主/次）/ KeyCap / Chip / MetaRow。
 * 统一 hover 0.18s、按下 scale .92 回弹 spring（stiffness 500, damping 22）。
 */
import { motion } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

/** 40px 圆形图标按钮：纸底 blur，hover 黄铜描边 + scale 1.06 */
export function IconButton({
  children,
  onClick,
  title,
  active = false,
  style,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  style?: CSSProperties;
}) {
  return (
    <motion.button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      whileHover={{ scale: 1.06, borderColor: 'var(--brass)' }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className="flex h-10 w-10 items-center justify-center rounded-full border"
      style={{
        background: 'rgba(244,241,234,.92)',
        backdropFilter: 'blur(12px)',
        borderColor: active ? 'var(--brass)' : 'var(--line)',
        color: active ? 'var(--brass)' : 'var(--ink)',
        boxShadow: '0 8px 24px -10px rgba(34,31,26,.28)',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

/** 主/次按钮：h40 px20 r10 t-ui 600 */
export function Button({
  children,
  onClick,
  variant = 'secondary',
  style,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  style?: CSSProperties;
}) {
  const primary = variant === 'primary';
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={primary ? { background: 'var(--brass-bright)' } : { borderColor: 'var(--brass)' }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className="flex h-10 items-center justify-center gap-2 rounded-[10px] px-5 text-sm font-semibold"
      style={
        primary
          ? { background: 'var(--brass)', color: 'var(--paper)', ...style }
          : { background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink)', ...style }
      }
    >
      {children}
    </motion.button>
  );
}

/** 键帽：mono 10px、纸灰底、1px 描边、r6 */
export function KeyCap({ children, tone = 'dim' }: { children: ReactNode; tone?: 'dim' | 'brass' }) {
  return (
    <span
      className="font-mono-lumen inline-flex min-w-[22px] items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
      style={
        tone === 'brass'
          ? { background: 'var(--brass)', color: 'var(--night)', border: '1px solid var(--brass)' }
          : { background: 'var(--paper-dim)', color: 'var(--ink-60)', border: '1px solid var(--line)' }
      }
    >
      {children}
    </span>
  );
}

/** 元信息行：label mono 10px 大写 + value 14px */
export function MetaRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-1">
      <span
        className="font-mono-lumen w-14 shrink-0 pt-0.5 text-[10px] font-medium uppercase tracking-[0.14em]"
        style={{ color: 'var(--stone)' }}
      >
        {label}
      </span>
      <span className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
        {value}
      </span>
    </div>
  );
}
