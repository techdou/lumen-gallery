/**
 * store.ts — zustand 全局状态机（overlay.md §1）
 *
 * appState 流转：
 *   loading ──资源就绪──▶ ready ──点击「进入展厅」──▶ entering ──运镜完──▶ explore
 *   explore ⇄ help（H）   explore ⇄ modal（E/点击展品）   modal ⇄ lightbox（放大浏览）
 *
 * 约定：任何非 explore 状态，漫游输入挂起、Pointer Lock 退出、3D 降帧 30fps。
 * 高频瞬态（玩家坐标/朝向）不走 store，见 playerRef（每帧直写，Minimap 用 rAF 读取）。
 */
import { create } from 'zustand';
import type { ExhibitsData, Exhibit, CharactersData } from '@/config/schema';

export type AppState =
  | 'loading'
  | 'ready'
  | 'entering'
  | 'explore'
  | 'modal'
  | 'lightbox'
  | 'help'
  | 'characters';
export type CameraMode = 'third' | 'first';

/** 角色选择持久化 key */
const CHARACTER_STORAGE_KEY = 'lumen.character';

/** 启动时读取本地记忆的角色 id（校验在数据加载后由 useGalleryLoader 完成） */
function readSavedCharacterId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(CHARACTER_STORAGE_KEY);
  } catch {
    return null;
  }
}

interface Store {
  appState: AppState;
  /** 加载数据（校验通过后写入） */
  data: ExhibitsData | null;
  /** 角色配置数据（characters.json 校验通过后写入） */
  characters: CharactersData | null;
  /** 当前角色 id（持久化 localStorage） */
  characterId: string | null;
  /** 预载失败的角色 id（运行时回退内置人台） */
  failedCharacters: string[];
  /** 打开角色选择器前的状态（关闭时返回） */
  charactersFrom: AppState;
  /** 0-1 真实加载进度 */
  progress: number;
  /** 布展小贴士下标（LoadingOverlay 轮换） */
  cameraMode: CameraMode;
  /** 当前展区 id */
  zone: string;
  /** 已进入过的展区（首次进入触发区域揭示） */
  visitedZones: string[];
  /** 当前聚焦展品 id（null=无） */
  focusedId: string | null;
  /** 弹窗中的展品 id */
  modalId: string | null;
  /** 灯箱打开（图片源） */
  lightboxSrc: string | null;
  /** 指针锁定状态 */
  pointerLocked: boolean;
  /** 移动端设备 */
  isMobile: boolean;
  /** 首次进入提示（横屏建议 / Esc 提示） */
  dismissedHints: string[];

  setData: (d: ExhibitsData) => void;
  setCharacters: (c: CharactersData) => void;
  /** 切换角色（持久化 localStorage，选择器点击即时生效） */
  setCharacterId: (id: string) => void;
  markCharacterFailed: (id: string) => void;
  /** 打开角色选择器（仅 explore / ready 可进入；记录返回态） */
  openCharacters: () => void;
  closeCharacters: () => void;
  toggleCharacters: () => void;
  setProgress: (p: number) => void;
  setReady: () => void;
  /** 点击「进入展厅」 */
  enterGallery: () => void;
  /** 入场运镜结束 */
  finishEntering: () => void;
  toggleCameraMode: () => void;
  setZone: (z: string) => void;
  setFocused: (id: string | null) => void;
  /** 打开展品弹窗 */
  openModal: (id: string) => void;
  closeModal: () => void;
  openLightbox: (src: string) => void;
  closeLightbox: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
  setPointerLocked: (v: boolean) => void;
  setMobile: (v: boolean) => void;
  dismissHint: (key: string) => void;
  /** Esc 逐层返回：lightbox > modal > help > explore */
  escape: () => void;
}

export const useStore = create<Store>((set, get) => ({
  appState: 'loading',
  data: null,
  characters: null,
  characterId: readSavedCharacterId(),
  failedCharacters: [],
  charactersFrom: 'explore',
  progress: 0,
  cameraMode: 'third',
  zone: 'hall',
  visitedZones: ['hall'],
  focusedId: null,
  modalId: null,
  lightboxSrc: null,
  pointerLocked: false,
  isMobile: false,
  dismissedHints: [],

  setData: (d) => set({ data: d }),
  setCharacters: (c) => set({ characters: c }),
  setCharacterId: (id) => {
    // 持久化到 localStorage（下次启动直接恢复）
    try {
      window.localStorage.setItem(CHARACTER_STORAGE_KEY, id);
    } catch {
      /* 隐私模式等场景忽略 */
    }
    set({ characterId: id });
  },
  markCharacterFailed: (id) =>
    set((s) => (s.failedCharacters.includes(id) ? s : { failedCharacters: [...s.failedCharacters, id] })),
  openCharacters: () =>
    set((s) =>
      s.appState === 'explore' || s.appState === 'ready'
        ? { appState: 'characters', charactersFrom: s.appState }
        : s,
    ),
  closeCharacters: () => set((s) => ({ appState: s.charactersFrom })),
  toggleCharacters: () => {
    const s = get();
    if (s.appState === 'characters') s.closeCharacters();
    else s.openCharacters();
  },
  setProgress: (p) => set({ progress: Math.min(1, Math.max(0, p)) }),
  setReady: () => set({ appState: 'ready' }),
  enterGallery: () => set({ appState: 'entering' }),
  finishEntering: () => set({ appState: 'explore' }),
  toggleCameraMode: () => set((s) => ({ cameraMode: s.cameraMode === 'third' ? 'first' : 'third' })),
  setZone: (z) =>
    set((s) =>
      s.zone === z
        ? s
        : { zone: z, visitedZones: s.visitedZones.includes(z) ? s.visitedZones : [...s.visitedZones, z] },
    ),
  setFocused: (id) => set((s) => (s.focusedId === id ? s : { focusedId: id })),
  openModal: (id) => set({ appState: 'modal', modalId: id, focusedId: null }),
  closeModal: () => set({ appState: 'explore', modalId: null }),
  openLightbox: (src) => set({ appState: 'lightbox', lightboxSrc: src }),
  closeLightbox: () => set((s) => ({ appState: s.modalId ? 'modal' : 'explore', lightboxSrc: null })),
  openHelp: () => set({ appState: 'help' }),
  closeHelp: () => set({ appState: 'explore' }),
  toggleHelp: () => set((s) => ({ appState: s.appState === 'help' ? 'explore' : 'help' })),
  setPointerLocked: (v) => set({ pointerLocked: v }),
  setMobile: (v) => set({ isMobile: v }),
  dismissHint: (key) => set((s) => ({ dismissedHints: [...s.dismissedHints, key] })),
  escape: () => {
    const s = get();
    if (s.appState === 'lightbox') s.closeLightbox();
    else if (s.appState === 'modal') s.closeModal();
    else if (s.appState === 'characters') s.closeCharacters();
    else if (s.appState === 'help') s.closeHelp();
  },
}));

/** 当前弹窗展品（便捷选择器） */
export function selectModalExhibit(s: Store): Exhibit | null {
  if (!s.data || !s.modalId) return null;
  return s.data.exhibits.find((e) => e.id === s.modalId) ?? null;
}

/**
 * 玩家瞬态（每帧直写，不经过 React）：
 * - x/z 世界坐标，yaw 朝向（弧度，0=面向+Z），speed 当前速率，running 是否疾跑
 * - camYaw/camPitch 相机朝向（相机 rig 直驱），camDistance 第三人称距离
 */
export const playerRef = {
  x: 0,
  z: 5.2,
  yaw: Math.PI, // 出生面向北（-Z）
  speed: 0,
  running: false,
  camYaw: Math.PI,
  camPitch: 0.12,
  camDistance: 3.4,
  /** 聚焦运镜请求：非 null 时相机 rig 执行 0.8s 运镜 */
  focusMove: null as null | { x: number; z: number; lookX: number; lookY: number; lookZ: number; t: number },
};
