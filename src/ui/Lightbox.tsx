/**
 * Lightbox.tsx — 图片灯箱（overlay.md §11，z 60）。
 * 全屏深色；图片 contain（max 92vw × 88vh）+ 1px 细描边；底部图注 + 倍率；
 * 滚轮/双指 ×1–×4 指数缩放，双击 1↔2 切换，缩放后拖拽平移（边界钳制 + 10% 橡皮筋）。
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore, selectModalExhibit } from '@/state/store';

export default function Lightbox() {
  const src = useStore((s) => s.lightboxSrc);
  const closeLightbox = useStore((s) => s.closeLightbox);
  const exhibit = useStore(selectModalExhibit);
  const isMobile = useStore((s) => s.isMobile);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hintVisible, setHintVisible] = useState(true);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 打开时重置 + 提示 3s 淡出
  useEffect(() => {
    if (src) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setHintVisible(true);
      const t = setTimeout(() => setHintVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [src]);

  // 平移边界钳制（±10% 橡皮筋在松手时回弹——此处简化为硬钳制 + 松手归零多余部分）
  const clampPan = (x: number, y: number, z: number): { x: number; y: number } => {
    if (z <= 1) return { x: 0, y: 0 };
    const el = wrapRef.current;
    const maxX = ((el?.clientWidth ?? window.innerWidth) * (z - 1)) / 2;
    const maxY = ((el?.clientHeight ?? window.innerHeight) * (z - 1)) / 2;
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  };

  const applyZoom = (next: number) => {
    const z = Math.min(4, Math.max(1, next));
    setZoom(z);
    setPan((p) => clampPan(p.x, p.y, z));
  };

  if (!src) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="lightbox"
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ background: 'rgba(20,18,15,.96)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onWheel={(ev) => applyZoom(zoom * (ev.deltaY > 0 ? 0.9 : 1.12))}
        onDoubleClick={() => applyZoom(zoom > 1 ? 1 : 2)}
        onPointerDown={(ev) => {
          (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
          drag.current = { x: ev.clientX, y: ev.clientY, px: pan.x, py: pan.y };
        }}
        onPointerMove={(ev) => {
          if (!drag.current) return;
          const dx = ev.clientX - drag.current.x;
          const dy = ev.clientY - drag.current.y;
          setPan(clampPan(drag.current.px + dx, drag.current.py + dy, zoom));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onTouchMove={(ev) => {
          if (ev.touches.length === 2) {
            const [a, b] = [ev.touches[0], ev.touches[1]];
            const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            if (pinch.current !== null) applyZoom(zoom * (d / pinch.current));
            pinch.current = d;
          }
        }}
        onTouchEnd={() => {
          pinch.current = null;
        }}
        ref={wrapRef}
      >
        {/* 图片 */}
        <motion.img
          src={src}
          alt={exhibit?.title ?? ''}
          draggable={false}
          className="select-none"
          style={{
            maxWidth: '92vw',
            maxHeight: '88vh',
            objectFit: 'contain',
            border: '1px solid rgba(244,241,234,.15)',
            boxShadow: '0 40px 120px -30px rgba(0,0,0,.8)',
          }}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: zoom, opacity: 1, x: pan.x, y: pan.y }}
          transition={{ scale: { duration: 0.18, ease: 'easeOut' }, opacity: { duration: 0.35 } }}
        />
        {/* 底部图注 */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <div className="font-serif-lumen text-[15px]" style={{ color: 'var(--paper)' }}>
            {exhibit?.title}
          </div>
          <div className="mt-0.5 text-xs" style={{ color: 'var(--stone)' }}>
            {[exhibit?.artist, exhibit?.year].filter(Boolean).join(' · ')}
          </div>
        </div>
        {/* 倍率 */}
        <div className="font-mono-lumen absolute bottom-6 left-6 text-[10px] uppercase" style={{ color: 'var(--stone)' }}>
          ×{zoom.toFixed(1)}
        </div>
        {/* 缩放提示（3s 淡出） */}
        <AnimatePresence>
          {hintVisible && (
            <motion.div
              className="absolute bottom-6 right-6 text-[12.5px]"
              style={{ color: 'var(--stone)' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMobile ? '双指缩放' : '滚轮缩放 · 拖拽平移 · 双击放大'}
            </motion.div>
          )}
        </AnimatePresence>
        {/* 关闭 */}
        <button
          type="button"
          aria-label="关闭灯箱"
          onClick={closeLightbox}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: 'rgba(244,241,234,.2)', color: 'var(--paper)' }}
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
