/**
 * HelpPanel.tsx — 帮助面板（overlay.md §9，z 40）。
 * 桌面居中卡片 / 移动端底部弹层：操作说明 + 关于本展 + 数据来源链接。
 * 遮罩点击 / Esc 关闭。
 */
import { motion } from 'framer-motion';
import { X, Move, MousePointer, ZoomIn, Hand } from 'lucide-react';
import { useStore } from '@/state/store';
import { KeyCap } from './primitives';

const DESKTOP_KEYS: [string, string][] = [
  ['W A S D', '移动'],
  ['Shift', '疾跑'],
  ['鼠标拖拽', '环视'],
  ['滚轮', '缩放'],
  ['E', '查看展品'],
  ['V', '切换视角'],
  ['点击画布', '指针锁定'],
  ['F', '全屏'],
  ['Esc', '关闭 / 释放鼠标'],
];

export default function HelpPanel() {
  const closeHelp = useStore((s) => s.closeHelp);
  const isMobile = useStore((s) => s.isMobile);
  const gallery = useStore((s) => s.data?.gallery);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* 遮罩 */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(20,18,15,.4)', backdropFilter: 'blur(4px)' }}
        onClick={closeHelp}
      />
      <motion.div
        className={
          isMobile
            ? 'lumen-scroll absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-2xl p-6'
            : 'lumen-scroll relative max-h-[80vh] w-[640px] overflow-y-auto rounded-[14px] p-8'
        }
        style={{ background: 'var(--paper)', boxShadow: '0 24px 60px -24px rgba(34,31,26,.35)' }}
        initial={isMobile ? { y: '100%' } : { opacity: 0, y: 24 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif-lumen text-[22px] font-medium">如何参观</h2>
          <button
            type="button"
            aria-label="关闭帮助"
            onClick={closeHelp}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--paper-dim)]"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {isMobile ? (
          <div className="space-y-3">
            {[
              [<Move key="m" size={18} strokeWidth={1.5} />, '左侧摇杆', '移动（推满疾跑）'],
              [<Hand key="h" size={18} strokeWidth={1.5} />, '右侧拖拽', '环视'],
              [<ZoomIn key="z" size={18} strokeWidth={1.5} />, '双指捏合', '缩放'],
              [<MousePointer key="p" size={18} strokeWidth={1.5} />, '点按展品', '查看详情'],
            ].map(([icon, k, v], i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span style={{ color: 'var(--brass)' }}>{icon}</span>
                <span className="w-20 font-medium">{k}</span>
                <span style={{ color: 'var(--ink-60)' }}>{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
            {DESKTOP_KEYS.map(([k, v]) => (
              <div key={k} className="flex items-center gap-2.5 text-sm">
                <KeyCap>{k}</KeyCap>
                <span style={{ color: 'var(--ink-60)' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        <div className="my-5 h-px" style={{ background: 'var(--line)' }} />
        <h3 className="font-serif-lumen mb-2 text-[15px] font-medium">关于本展</h3>
        <p className="text-[13px] leading-[1.8]" style={{ color: 'var(--ink-60)' }}>
          「{gallery?.title} · {gallery?.titleEn}」基于 LUMEN 流明 3D 虚拟美术馆模板构建——展品、展区与文案全部由
          <span className="font-mono-lumen text-[12px]"> exhibits.json </span>
          配置驱动，换素材即换展。展品均来自公共领域开放馆藏，仅用于演示：
          <a href="https://www.metmuseum.org/art/collection" target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--brass)' }}>大都会开放获取</a>
          {' · '}
          <a href="https://www.artic.edu/open-access" target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--brass)' }}>芝加哥艺术博物馆</a>
          {' · '}
          <a href="https://durian.blender.org/" target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--brass)' }}>Blender 基金会</a>
        </p>
        <div className="mt-5 text-center text-[12.5px]" style={{ color: 'var(--stone)' }}>
          按 Esc 或点击空白处关闭
        </div>
      </motion.div>
    </motion.div>
  );
}
