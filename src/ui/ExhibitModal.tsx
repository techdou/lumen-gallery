/**
 * ExhibitModal.tsx — 展品详情弹窗（overlay.md §10，z 50）★
 * 桌面：右侧 420px 抽屉（无遮罩，点外部关闭）；移动端：85vh 底部弹层（可下划半收至 40vh）。
 * 内容：编号行 / 媒体区（图→灯箱；视频带声续播）/ 作品名 / 元信息表 / 黄铜细线 / 简介 / 操作行 / 页脚。
 * 打开时序：聚焦运镜 0.5s 时抽屉滑入（spring 260/30），内容 stagger 0.06s。
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ExternalLink } from 'lucide-react';
import { useStore, selectModalExhibit } from '@/state/store';
import { Button, MetaRow } from './primitives';
import { assetUrl } from '@/utils/asset';

export default function ExhibitModal() {
  const exhibit = useStore(selectModalExhibit);
  const closeModal = useStore((s) => s.closeModal);
  const openLightbox = useStore((s) => s.openLightbox);
  const isMobile = useStore((s) => s.isMobile);
  const [half, setHalf] = useState(false);

  const blocks = (key: string, children: React.ReactNode, i: number) => (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );

  return (
    <AnimatePresence>
      {exhibit && (
        <div key="modal" className="fixed inset-0 z-50" onClick={closeModal}>
          <motion.div
            className={
              isMobile
                ? 'absolute bottom-0 left-0 right-0 flex flex-col rounded-t-2xl'
                : 'absolute bottom-0 right-0 top-0 flex w-[420px] flex-col rounded-l-[14px] border-l'
            }
            style={{
              background: 'var(--paper)',
              borderColor: 'var(--line)',
              boxShadow: '0 0 0 1px rgba(34,31,26,.06), -24px 0 80px -32px rgba(20,18,15,.45)',
              height: isMobile ? (half ? '40vh' : '85vh') : '100%',
            }}
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            onClick={(ev) => ev.stopPropagation()}
          >
            {/* 移动端拖拽柄：上拖展开 / 下拖半收 / 继续下拖关闭 */}
            {isMobile && (
              <div
                className="flex h-6 shrink-0 cursor-grab items-center justify-center"
                onClick={() => setHalf((v) => !v)}
              >
                <div className="h-1 w-9 rounded-full" style={{ background: 'var(--line)' }} />
              </div>
            )}
            <div className="lumen-scroll flex-1 overflow-y-auto px-6 pb-6 pt-5">
              {/* 编号行 */}
              {blocks(
                'id',
                <div className="flex items-center justify-between">
                  <span className="font-mono-lumen text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: 'var(--brass)' }}>
                    {exhibit.id} · {exhibit.type}
                  </span>
                  <button
                    type="button"
                    aria-label="关闭"
                    onClick={closeModal}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--paper-dim)]"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>,
                0,
              )}

              {/* 媒体区 */}
              {exhibit.type === 'image' && exhibit.src &&
                blocks(
                  'media',
                  <button
                    type="button"
                    className="group relative mt-4 block w-full overflow-hidden rounded-[10px]"
                    style={{ aspectRatio: '16/10', background: 'var(--paper-dim)' }}
                    onClick={() => openLightbox(assetUrl(exhibit.src))}
                    aria-label="放大浏览"
                  >
                    <img src={assetUrl(exhibit.src)} alt={exhibit.title} className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ background: 'rgba(20,18,15,.7)', color: 'var(--paper)' }}>
                      <ZoomIn size={16} strokeWidth={1.5} />
                    </span>
                  </button>,
                  1,
                )}
              {exhibit.type === 'video' && exhibit.src &&
                blocks(
                  'media',
                  <div className="mt-4 overflow-hidden rounded-[10px]" style={{ background: 'var(--night)' }}>
                    {/* 弹窗内带声续播（场景内屏幕同步暂停） */}
                    <video src={assetUrl(exhibit.src)} poster={assetUrl(exhibit.poster)} controls autoPlay className="aspect-video w-full" />
                  </div>,
                  1,
                )}
              {exhibit.type === 'link' &&
                blocks(
                  'media',
                  <div className="mt-4 flex h-24 items-center justify-center rounded-[10px] border" style={{ borderColor: 'var(--brass)', background: 'var(--brass-wash)' }}>
                    <ExternalLink size={48} strokeWidth={1} style={{ color: 'var(--brass)' }} />
                  </div>,
                  1,
                )}

              {/* 作品名 */}
              {blocks(
                'title',
                <div className="mt-4">
                  <h2 className="font-serif-lumen text-[26px] font-medium leading-[1.25]">{exhibit.title}</h2>
                  {exhibit.titleEn && (
                    <div className="font-serif-lumen mt-1 text-[15px] italic" style={{ color: 'var(--stone)' }}>
                      {exhibit.titleEn}
                    </div>
                  )}
                </div>,
                2,
              )}

              {/* 元信息表 */}
              {blocks(
                'meta',
                <div className="mt-3">
                  <MetaRow label="作者" value={exhibit.artist} />
                  <MetaRow label="年代" value={exhibit.year} />
                  <MetaRow label="媒材" value={exhibit.medium} />
                  <MetaRow label="来源" value={exhibit.credit} />
                </div>,
                3,
              )}

              {/* 黄铜细线 */}
              {blocks('line', <div className="my-4 h-px w-full" style={{ background: 'rgba(166,124,61,.4)' }} />, 4)}

              {/* 简介 */}
              {blocks(
                'desc',
                <p className="lumen-scroll max-h-[30vh] overflow-y-auto text-justify text-[15px] leading-[1.75]" style={{ color: 'var(--ink)' }}>
                  {exhibit.description}
                  {exhibit.type === 'model' && (
                    <span className="mt-2 block text-[13px]" style={{ color: 'var(--stone)' }}>
                      （本展品为三维陈列，可关闭弹窗后环绕展台观看。）
                    </span>
                  )}
                </p>,
                5,
              )}

              {/* 操作行 */}
              {blocks(
                'actions',
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {exhibit.type === 'image' && exhibit.src && (
                    <Button variant="primary" onClick={() => openLightbox(assetUrl(exhibit.src))}>
                      <ZoomIn size={16} strokeWidth={1.5} />
                      放大浏览
                    </Button>
                  )}
                  {exhibit.link && (
                    <Button onClick={() => window.open(exhibit.link, '_blank', 'noopener')}>
                      {exhibit.type === 'link' ? '前往访问' : '查看来源'}
                      <ExternalLink size={14} strokeWidth={1.5} />
                    </Button>
                  )}
                  <Button onClick={closeModal}>关闭</Button>
                </div>,
                6,
              )}

              {/* 页脚 */}
              {blocks(
                'footer',
                <div className="mt-6 text-[12.5px]" style={{ color: 'var(--stone)' }}>
                  素材许可见 ASSETS-LICENSE
                </div>,
                7,
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
