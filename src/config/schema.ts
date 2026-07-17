/**
 * schema.ts — 展品数据契约（exhibits.json）的 TypeScript 类型与 zod 校验
 *
 * 设计文档 design.md §13：这是模板复用的核心合同。
 * 校验策略：进入场景前整体校验；单条展品不合法时打印**中文警告**并跳过，
 * 不阻断整个展览（坏数据容错）。
 */
import { z } from 'zod';

/** 展品内容类型 */
export const ExhibitTypeSchema = z.enum(['image', 'video', 'model', 'text', 'link']);
export type ExhibitType = z.infer<typeof ExhibitTypeSchema>;

/** 展陈方式（决定 3D 构件） */
export const MountTypeSchema = z.enum(['wall-frame', 'pedestal', 'vitrine', 'screen', 'panel']);
export type MountType = z.infer<typeof MountTypeSchema>;

/** 画框类型（wall-frame 专用） */
export const FrameTypeSchema = z.enum(['oak', 'black', 'gilt', 'none']);
export type FrameType = z.infer<typeof FrameTypeSchema>;

/** 单件展品 */
export const ExhibitSchema = z.object({
  id: z.string().min(1),
  type: ExhibitTypeSchema,
  zone: z.string().min(1),
  mount: MountTypeSchema,
  title: z.string().min(1),
  titleEn: z.string().optional(),
  artist: z.string().optional(),
  year: z.string().optional(),
  medium: z.string().optional(),
  credit: z.string().optional(),
  description: z.string().min(1),
  src: z.string().optional(),
  poster: z.string().optional(),
  link: z.string().optional(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotationDeg: z.number().default(0),
  size: z.object({ w: z.number().positive(), h: z.number().positive() }).optional(),
  frame: FrameTypeSchema.optional(),
  focusRadius: z.number().positive().default(2.6),
  spotlight: z.boolean().default(true),
  modelScale: z.number().positive().default(1),
  /** 模型绕 X 轴的旋转矫正（度数）。用于"躺平"扫描——
   * 例如 SMK 扫描时雕塑平放、Z 是真实高度，配 -90 让它立起。 */
  modelRotationDeg: z.number().default(0),
  spin: z.boolean().default(false),
});
export type Exhibit = z.infer<typeof ExhibitSchema>;

/** 展区（与碰撞、小地图共用 bounds） */
export const ZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nameEn: z.string().min(1),
  /** [minX, minZ, maxX, maxZ] */
  bounds: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});
export type Zone = z.infer<typeof ZoneSchema>;

/** 全局 gallery 配置 */
export const GalleryConfigSchema = z.object({
  title: z.string().min(1),
  titleEn: z.string().optional(),
  subtitle: z.string().optional(),
  preface: z.string().default(''),
  sound: z.boolean().default(false),
  spawn: z.object({
    position: z.tuple([z.number(), z.number(), z.number()]),
    headingDeg: z.number().default(0),
  }),
  accent: z.string().default('#A67C3D'),
});
export type GalleryConfig = z.infer<typeof GalleryConfigSchema>;

/** 顶层数据结构 */
export const ExhibitsFileSchema = z.object({
  gallery: GalleryConfigSchema,
  zones: z.array(ZoneSchema).min(1),
  exhibits: z.array(z.unknown()),
});

/** 校验通过后的完整数据 */
export interface ExhibitsData {
  gallery: GalleryConfig;
  zones: Zone[];
  exhibits: Exhibit[];
}

/** 世界边界（用于 position 越界检查，比户型略放 1m 容差） */
const WORLD_LIMIT = { x: 30, zMin: -19, zMax: 9 };

/**
 * 解析并校验 exhibits.json 原始 JSON。
 * - 顶层结构不合法：抛错（无法构成展览）
 * - 单件展品不合法 / zone 不存在 / 坐标越界：中文警告并跳过
 */
export function parseExhibitsFile(raw: unknown): ExhibitsData {
  const top = ExhibitsFileSchema.safeParse(raw);
  if (!top.success) {
    console.error('[LUMEN] exhibits.json 顶层结构校验失败：', top.error.issues);
    throw new Error('exhibits.json 顶层结构不合法（gallery/zones/exhibits 缺失或类型错误）');
  }
  const { gallery, zones } = top.data;
  const zoneIds = new Set(zones.map((zn) => zn.id));
  const seen = new Set<string>();
  const exhibits: Exhibit[] = [];

  top.data.exhibits.forEach((item, i) => {
    const r = ExhibitSchema.safeParse(item);
    if (!r.success) {
      console.warn(`[LUMEN] 第 ${i + 1} 件展品数据不合法，已跳过：`, r.error.issues[0]?.message, item);
      return;
    }
    const e = r.data;
    if (seen.has(e.id)) {
      console.warn(`[LUMEN] 展品「${e.id}」编号重复，已跳过后者。`);
      return;
    }
    if (!zoneIds.has(e.zone)) {
      console.warn(`[LUMEN] 展品「${e.id}」所属展区「${e.zone}」不存在，已跳过。`);
      return;
    }
    const [px, , pz] = e.position;
    if (Math.abs(px) > WORLD_LIMIT.x || pz < WORLD_LIMIT.zMin || pz > WORLD_LIMIT.zMax) {
      console.warn(`[LUMEN] 展品「${e.id}」坐标 (${px}, ${pz}) 越界，已跳过。`);
      return;
    }
    if ((e.type === 'image' || e.type === 'video') && !e.src) {
      console.warn(`[LUMEN] 展品「${e.id}」类型为 ${e.type} 但缺少 src 素材路径，已跳过。`);
      return;
    }
    if (e.type === 'link' && !e.link) {
      console.warn(`[LUMEN] 展品「${e.id}」类型为 link 但缺少 link 地址，已跳过。`);
      return;
    }
    seen.add(e.id);
    exhibits.push(e);
  });

  if (exhibits.length < top.data.exhibits.length) {
    console.warn(`[LUMEN] 共 ${top.data.exhibits.length} 件展品，${exhibits.length} 件通过校验，其余已跳过（详见上方警告）。`);
  }
  return { gallery, zones, exhibits };
}

/* ------------------------------------------------------------------ */
/* 角色数据契约（characters.json）                                       */
/* ------------------------------------------------------------------ */

/**
 * 动画 clip 名映射（可选）：角色 GLB 的动画命名不符合
 * `CharacterArmature|Idle|Walk|Run` 约定时，在此显式指定 clip 名。
 */
export const CharacterClipsSchema = z.object({
  idle: z.string().min(1).optional(),
  walk: z.string().min(1).optional(),
  run: z.string().min(1).optional(),
});
export type CharacterClips = z.infer<typeof CharacterClipsSchema>;

/** 单个可选角色 */
export const CharacterSchema = z.object({
  id: z.string().min(1),
  /** 显示名（选择器卡片主标题） */
  name: z.string().min(1),
  /** 角色定位标签 */
  label: z.string().min(1),
  /** 一句话描述 */
  desc: z.string().default(''),
  /** GLB 路径；null = 内置程序化人台 */
  src: z.string().min(1).nullable().default(null),
  /** 目标身高（米），加载后按实测包围盒等比缩放到该高度 */
  height: z.number().positive().default(1.75),
  clips: CharacterClipsSchema.optional(),
});
export type Character = z.infer<typeof CharacterSchema>;

/** characters.json 顶层结构 */
export const CharactersFileSchema = z.object({
  default: z.string().min(1),
  characters: z.array(z.unknown()).min(1),
});

/** 校验通过后的角色数据 */
export interface CharactersData {
  default: string;
  characters: Character[];
}

/** characters.json 彻底不可用时的兜底：仅内置程序化人台 */
export const FALLBACK_CHARACTERS: CharactersData = {
  default: 'mannequin',
  characters: [
    {
      id: 'mannequin',
      name: '流明人台',
      label: '经典人台',
      desc: '默认美术馆陶瓷人台（内置程序化角色）',
      src: null,
      height: 1.75,
    },
  ],
};

/**
 * 解析并校验 characters.json 原始 JSON。
 * 容错策略（与展品一致，中文警告）：
 * - 顶层结构不合法：警告并整体回退为「仅人台」配置（不抛错、不阻断展览）；
 * - 单条角色不合法 / id 重复：警告并跳过；
 * - default 指向不存在的角色：警告并回退为首个合法角色。
 */
export function parseCharactersFile(raw: unknown): CharactersData {
  const top = CharactersFileSchema.safeParse(raw);
  if (!top.success) {
    console.warn('[LUMEN] characters.json 顶层结构校验失败，已回退为内置人台角色：', top.error.issues[0]?.message);
    return FALLBACK_CHARACTERS;
  }
  const seen = new Set<string>();
  const characters: Character[] = [];
  top.data.characters.forEach((item, i) => {
    const r = CharacterSchema.safeParse(item);
    if (!r.success) {
      console.warn(`[LUMEN] 第 ${i + 1} 条角色数据不合法，已跳过：`, r.error.issues[0]?.message, item);
      return;
    }
    if (seen.has(r.data.id)) {
      console.warn(`[LUMEN] 角色「${r.data.id}」编号重复，已跳过后者。`);
      return;
    }
    seen.add(r.data.id);
    characters.push(r.data);
  });
  if (characters.length === 0) {
    console.warn('[LUMEN] characters.json 无一条角色通过校验，已回退为内置人台角色。');
    return FALLBACK_CHARACTERS;
  }
  let def = top.data.default;
  if (!seen.has(def)) {
    console.warn(`[LUMEN] characters.json 的 default「${def}」不存在，已回退为「${characters[0].id}」。`);
    def = characters[0].id;
  }
  return { default: def, characters };
}
