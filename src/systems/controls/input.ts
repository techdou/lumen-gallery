/**
 * input.ts — 全输入源的共享瞬态（不走 React state，避免每帧重渲染）。
 * 键盘按键集 / 虚拟摇杆向量 / 点按回调 / 第一人称 FOV 微调。
 */
export const input = {
  /** 按下的键（KeyboardEvent.code） */
  keys: new Set<string>(),
  /** 虚拟摇杆：ox/oy 原点（px），x/y 输出向量 [-1,1]（屏幕坐标，y 向下为正） */
  joystick: { active: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 },
  /** 点按展品的射线回调（由场景内 TapHandler 注册） */
  tapHandler: null as null | ((ndcX: number, ndcY: number) => void),
  /** 第一人称 FOV 微调（滚轮/捏合，±6） */
  fovAdjust: { current: 0 },
};

/** 漫游输入是否挂起（非 explore 状态挂起） */
export function inputSuspended(appState: string): boolean {
  return appState !== 'explore';
}
