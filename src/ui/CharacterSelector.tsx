/**
 * CharacterSelector.tsx — 角色选择器（overlay 层，z 40）。
 * 桌面居中卡片 / 移动端底部弹层：每个角色一张卡片（名称 + 标签 + 一句描述），
 * 当前选中黄铜描边 + 角标勾。点击即时切换（面板保持打开可继续预览），
 * 遮罩点击 / Esc / 右上 X 关闭（返回进入前的状态：explore 或 ready）。
 */
import { motion } from 'framer-motion';
import { X, Check, PersonStanding } from 'lucide-react';
import { useStore } from '@/state/store';

export default function CharacterSelector() {
  const characters = useStore((s) => s.characters);
  const characterId = useStore((s) => s.characterId);
  const setCharacterId = useStore((s) => s.setCharacterId);
  const closeCharacters = useStore((s) => s.closeCharacters);
  const isMobile = useStore((s) => s.isMobile);

  const currentId = characterId ?? characters?.default;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* 遮罩（点击关闭） */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(20,18,15,.4)', backdropFilter: 'blur(4px)' }}
        onClick={closeCharacters}
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
          <h2 className="font-serif-lumen text-[22px] font-medium">选择角色</h2>
          <button
            type="button"
            aria-label="关闭角色选择"
            onClick={closeCharacters}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--paper-dim)]"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className={isMobile ? 'space-y-3' : 'grid grid-cols-2 gap-3'}>
          {(characters?.characters ?? []).map((c) => {
            const selected = c.id === currentId;
            return (
              <motion.button
                key={c.id}
                type="button"
                onClick={() => setCharacterId(c.id)}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-start gap-3 rounded-[12px] border p-4 text-left"
                style={{
                  borderColor: selected ? 'var(--brass)' : 'var(--line)',
                  background: selected ? 'rgba(166,124,61,.06)' : 'transparent',
                  boxShadow: selected ? '0 8px 24px -14px rgba(166,124,61,.5)' : 'none',
                  transition: 'border-color .18s ease, background .18s ease',
                }}
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: selected ? 'var(--brass)' : 'var(--paper-dim)',
                    color: selected ? 'var(--paper)' : 'var(--ink-60)',
                  }}
                >
                  <PersonStanding size={18} strokeWidth={1.5} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="font-serif-lumen text-[16px] font-medium">{c.name}</span>
                    <span className="text-[12px]" style={{ color: 'var(--stone)' }}>
                      {c.label}
                    </span>
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-[1.6]" style={{ color: 'var(--ink-60)' }}>
                    {c.desc}
                  </span>
                </span>
                {selected && (
                  <span
                    className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ background: 'var(--brass)', color: 'var(--paper)' }}
                  >
                    <Check size={13} strokeWidth={2.5} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-5 text-center text-[12.5px]" style={{ color: 'var(--stone)' }}>
          角色模型：Quaternius（Public Domain / CC0）· 按 Esc 或点击空白处关闭
        </div>
      </motion.div>
    </motion.div>
  );
}
