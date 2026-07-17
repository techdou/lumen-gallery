/**
 * Minimap.tsx — SVG 小地图（overlay.md §6）。
 * viewBox 0 0 224 96（1m = 3.6px），数据源 = zones 矩形 + 展品点；
 * 玩家 = 6px 墨点 + 18° 黄铜朝向楔形，位置/朝向由 rAF 直改 transform（不走 React state）。
 * 移动端：默认收起为右下角圆形按钮，点击展开为抽屉。
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map as MapIcon, X } from 'lucide-react';
import { useStore, playerRef } from '@/state/store';
import { FLOOR_PLAN } from '@/systems/zones';

const SCALE = 3.6;
// 世界 x∈[-28,28] z∈[-17,7] → 映射到 224×96
const OX = (224 - 56 * SCALE) / 2 + 28 * SCALE; // = 11.2 + 100.8
const OZ = (96 - 24 * SCALE) / 2 + 17 * SCALE;
const mx = (x: number) => OX + x * SCALE;
const mz = (z: number) => OZ + z * SCALE;

export default function Minimap() {
  const zones = useStore((s) => s.data?.zones);
  const exhibits = useStore((s) => s.data?.exhibits);
  const zoneId = useStore((s) => s.zone);
  const focusedId = useStore((s) => s.focusedId);
  const isMobile = useStore((s) => s.isMobile);
  const [open, setOpen] = useState(false);
  const playerG = useRef<SVGGElement>(null);

  // 每帧直写玩家点（rAF，不走 React state）
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const g = playerG.current;
      if (!g) return;
      // SVG 旋转为顺时针；楔形初始指向北（上），故转角 = 180 - yawDeg
      g.setAttribute(
        'transform',
        `translate(${mx(playerRef.x)} ${mz(playerRef.z)}) rotate(${180 - (playerRef.camYaw * 180) / Math.PI})`,
      );
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const mapSvg = (
    <svg viewBox="0 0 224 96" className="block h-full w-full">
      {/* 区域矩形（门洞处用填充色补开口的视觉效果由描边缺口近似） */}
      {FLOOR_PLAN.map((fp) => {
        const [minX, minZ, maxX, maxZ] = fp.bounds;
        const active = zoneId === fp.id;
        return (
          <rect
            key={fp.id}
            x={mx(minX)}
            y={mz(minZ)}
            width={(maxX - minX) * SCALE}
            height={(maxZ - minZ) * SCALE}
            fill={active ? 'rgba(166,124,61,.12)' : 'transparent'}
            stroke={active ? 'var(--brass)' : 'var(--ink-38)'}
            strokeWidth={active ? 1.2 : 1}
            style={{ transition: 'fill .3s, stroke .3s' }}
          />
        );
      })}
      {/* 展品点 */}
      {exhibits?.map((e) => (
        <circle
          key={e.id}
          cx={mx(e.position[0])}
          cy={mz(e.position[2])}
          r={focusedId === e.id ? 1.75 : 1.25}
          fill={focusedId === e.id ? 'var(--brass)' : 'var(--ink-38)'}
        />
      ))}
      {/* 玩家（rAF 直写） */}
      <g ref={playerG}>
        <path d="M0 -5 L3 3 L-3 3 Z" fill="var(--brass)" opacity={0.9} />
        <circle r={2.2} fill="var(--ink)" />
      </g>
    </svg>
  );

  // 移动端：收起为圆形按钮，点开为抽屉
  if (isMobile) {
    return (
      <>
        <motion.button
          type="button"
          aria-label="地图"
          className="pointer-events-auto absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border"
          style={{ background: 'rgba(244,241,234,.92)', borderColor: 'var(--line)', backdropFilter: 'blur(12px)' }}
          onClick={() => setOpen(true)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 28, delay: 0.24 }}
        >
          <MapIcon size={18} strokeWidth={1.5} />
        </motion.button>
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                className="pointer-events-auto absolute inset-0 z-[25] bg-black/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />
              <motion.div
                className="pointer-events-auto absolute bottom-0 right-0 top-0 z-[26] w-[70%] p-4"
                style={{ background: 'var(--paper)' }}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-serif-lumen text-[15px]">展厅平面图</span>
                  <button type="button" aria-label="关闭地图" onClick={() => setOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="h-40">{mapSvg}</div>
                <div className="mt-3 space-y-1">
                  {zones?.map((z) => (
                    <div key={z.id} className="flex items-center gap-2 text-[12.5px]" style={{ color: z.id === zoneId ? 'var(--brass)' : 'var(--ink-60)' }}>
                      <span className="block h-1.5 w-1.5" style={{ background: z.id === zoneId ? 'var(--brass)' : 'var(--ink-38)' }} />
                      {z.name}
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <motion.div
      className="absolute bottom-4 left-4 rounded-[14px] border p-2"
      style={{
        width: 236,
        height: 120,
        background: 'rgba(244,241,234,.92)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--line)',
        boxShadow: '0 8px 24px -10px rgba(34,31,26,.28)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 28, delay: 0.24 }}
    >
      {mapSvg}
    </motion.div>
  );
}
