/**
 * site.ts — 全局常量：速度、相机、灯光预算、性能守卫
 * 数值均来自 design.md §15 / gallery.md §4 §9 §10。
 */

/** 是否为移动端 / 低性能设备（加载期一次性判定，运行中不动态改） */
export const IS_MOBILE: boolean =
  typeof navigator !== 'undefined' &&
  (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.hardwareConcurrency ?? 8) <= 4);

/** 渲染与性能预算 */
const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
export const PERF = {
  pixelRatio: IS_MOBILE ? Math.min(DPR, 1.5) : Math.min(DPR, 2),
  /** 同屏激活射灯上限（常亮 2 + 就近） */
  maxActiveSpots: IS_MOBILE ? 5 : 8,
  /** 平行光阴影贴图尺寸 */
  dirShadowMap: IS_MOBILE ? 1024 : 2048,
  /** 雾密度 */
  fogDensity: IS_MOBILE ? 0.012 : 0.008,
  /** 弹窗/灯箱/帮助打开时的降帧帧率 */
  degradedFps: 30,
  /** 玻璃磨砂（移动端降级） */
  glassFrosted: IS_MOBILE,
} as const;

/** 行走与碰撞 */
export const MOVE = {
  walkSpeed: 3.0, // m/s
  runMultiplier: 1.8,
  capsuleRadius: 0.32,
  capsuleHeight: 1.75,
} as const;

/** 相机 */
export const CAMERA = {
  third: {
    fov: 55,
    anchorHeight: 1.55,
    distance: 3.4,
    minDistance: 1.6,
    maxDistance: 6.0,
    shoulder: 0.35,
    pitchMin: (-60 * Math.PI) / 180,
    pitchMax: (75 * Math.PI) / 180,
    posLerp: 0.12,
  },
  first: {
    fov: 70,
    eyeHeight: 1.62,
    pitchMin: (-80 * Math.PI) / 180,
    pitchMax: (80 * Math.PI) / 180,
  },
  /** 鼠标灵敏度 rad/px */
  sensDrag: 0.0042,
  sensLock: 0.0023,
  sensTouch: 0.004,
  /** 相机避障球半径与下限 */
  obstacleRadius: 0.25,
  minHitDistance: 0.6,
} as const;

/** 灯光参数（gallery.md §4） */
export const LIGHTS = {
  hemiSky: '#FFF9EF',
  hemiGround: '#CFC4B0',
  hemiIntensity: 0.55,
  dirColor: '#FFF2E0',
  dirIntensity: 1.1,
  spotColor: '#FFE3C2',
  spotIntensity: 2.2,
  spotFocusIntensity: 3.0,
  spotAngle: 0.42,
  spotFocusAngle: 0.36,
  spotPenumbra: 0.5,
  spotDistance: 9,
  spotDecay: 1.6,
  hallPointColor: '#FFEEDD',
  hallPointIntensity: 0.35,
} as const;

/** 交互 */
export const INTERACT = {
  /** 聚焦判定节流间隔（秒） */
  focusThrottle: 0.1,
  /** 玩家朝向与展品方向的最大夹角（弧度，55°） */
  focusAngle: (55 * Math.PI) / 180,
  /** 聚焦运镜耗时（秒） */
  focusAnimTime: 0.8,
  /** 观赏位距展品正前方距离 */
  viewDistance: 2.2,
} as const;

/** 设计 token（3D 场景材质色板，design.md §4.2） */
export const MAT = {
  wall: '#F1EDE3',
  trim: '#2A2723',
  floorHall: '#B9B0A0',
  floorOak: '#B39772',
  pedestal: '#F1EDE3',
  trackShell: '#1D1B18',
  frameBlack: '#211E19',
  frameOak: '#9A7B54',
  frameGilt: '#8F6F35',
  brass: '#A67C3D',
  brassBright: '#C89B5A',
  avatar: '#B9B2A4',
  fog: '#F4F1EA',
  matboard: '#EFE9DC', // 画芯内衬卡纸
  skylight: '#FFF6E8',
} as const;
