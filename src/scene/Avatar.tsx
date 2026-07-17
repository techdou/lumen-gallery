/**
 * Avatar.tsx — 多角色系统（characters.json 数据驱动）。
 * - 当前角色带 GLB：useGLTF 加载 → SkeletonUtils.clone → Box3 实测归一化
 *   （按配置 height 等比缩放、脚底对齐 y=0）→ AnimationMixer 状态机
 *   （Idle <0.1 / Walk <3.1 / Run，crossFadeTo 0.25s 平滑切换，面朝移动方向）。
 * - src 为 null 或 GLB 加载失败：回退内置程序化陶瓷人台 MannequinBody
 *   （保留 gallery.md §8 的呼吸/行走起伏/头部游走程序动画）。
 * 共用规则（两种角色一致）：第一人称整身隐藏、出生升起 0.5s、
 * 身体朝向 = 移动方向（角速度 10 rad/s）、假投影 blob、castShadow。
 * 角色素材：Quaternius《Ultimate Animated Character Pack》（CC0），
 * clip 命名 `CharacterArmature|Idle|Walk|Run`（注意 animations[0] 是 Death，必须按名索引）。
 */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MAT } from '@/config/site';
import { shadowBlobTexture } from '@/scene/textures';
import { useStore, playerRef } from '@/state/store';
import { assetUrl } from '@/utils/asset';
import type { Character } from '@/config/schema';

/** 角色切换原地淡入时长（秒） */
const FADE_IN = 0.35;
/** 动画状态切换淡变时长（秒） */
const CROSS_FADE = 0.25;
/** Walk→Run 速度阈值（walkSpeed 3.0，留 0.1 容差避免满速行走误判） */
const RUN_SPEED = 3.1;

type AnimState = 'idle' | 'walk' | 'run';

/**
 * 按名字索引动画 clip（GLB 内 animations[0] 是 Death，严禁按下标取）。
 * 优先级：配置 clips 映射 → `CharacterArmature|X` 约定 → 任意 `*|X` 后缀 → 裸名（忽略大小写）。
 */
function resolveClip(
  clips: THREE.AnimationClip[],
  mapped: string | undefined,
  canonical: string,
): THREE.AnimationClip | null {
  if (mapped) return clips.find((c) => c.name === mapped) ?? null;
  return (
    clips.find((c) => c.name === `CharacterArmature|${canonical}`) ??
    clips.find((c) => c.name.endsWith(`|${canonical}`)) ??
    clips.find((c) => c.name.toLowerCase() === canonical.toLowerCase()) ??
    null
  );
}

/** 收集模型全部材质（去重），供切换淡入使用 */
function collectMaterials(root: THREE.Object3D): THREE.Material[] {
  const mats = new Map<string, THREE.Material>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of list) if (m && !mats.has(m.uuid)) mats.set(m.uuid, m);
  });
  return [...mats.values()];
}

/* ------------------------------------------------------------------ */
/* GLB 角色身体（骨骼动画）                                              */
/* ------------------------------------------------------------------ */
function CharacterBody({ char }: { char: Character }) {
  const url = assetUrl(char.src!);
  const gltf = useGLTF(url);
  const markCharacterFailed = useStore((s) => s.markCharacterFailed);

  // 克隆场景（蒙皮网格必须用 SkeletonUtils.clone，否则骨骼绑定错乱）
  const model = useMemo(() => skeletonClone(gltf.scene), [gltf.scene]);

  // 归一化：Box3 实测模型高度 → 等比缩放到配置 height → 脚底对齐 y=0
  const { scale, footY } = useMemo(() => {
    // 关键坑：蒙皮网格的 Box3 依赖 skeleton.boneMatrices，而它只在渲染器
    // 绘制前刷新。本 useMemo 早于首帧渲染，直接测量会拿到「未蒙皮原始
    // 几何」的错误包围盒（实测差出两个数量级，角色变成 5 米巨人）。
    // 因此先手动更新世界矩阵 + 骨架矩阵，并清掉可能缓存的过期包围盒。
    model.updateMatrixWorld(true);
    model.traverse((o) => {
      const sm = o as THREE.SkinnedMesh;
      if (sm.isSkinnedMesh) {
        sm.skeleton.update();
        // r185 类型声明把 boundingBox 标为非空，运行时可置空强制下次重算
        (sm as unknown as { boundingBox: THREE.Box3 | null }).boundingBox = null;
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = size.y > 0 ? char.height / size.y : 1;
    const fy = -box.min.y * s;
    console.info(`[LUMEN] 角色「${char.name}」归一化：实测高 ${size.y.toFixed(2)}m → scale=${s.toFixed(3)} footY=${fy.toFixed(3)}`);
    return { scale: s, footY: fy };
  }, [model, char.height, char.name]);

  // 阴影与蒙皮包围盒（蒙皮网格 frustumCulled 关闭，避免骨骼动画出包围盒误剔除）
  useMemo(() => {
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) mesh.frustumCulled = false;
    });
  }, [model]);

  // 切换淡入：材质先全透明再渐显（记录原始 transparent 以便还原）
  const fadeMats = useMemo(
    () =>
      collectMaterials(model).map((m) => {
        const rec = { m, transparent: m.transparent };
        m.transparent = true;
        m.opacity = 0;
        return rec;
      }),
    [model],
  );
  const fadeK = useRef(0);

  // 动画状态机：mixer + 三条 clip（idle/walk/run），clip 缺失时中文警告并回退人台
  const anim = useMemo(() => {
    const idle = resolveClip(gltf.animations, char.clips?.idle, 'Idle');
    const walk = resolveClip(gltf.animations, char.clips?.walk, 'Walk');
    const run = resolveClip(gltf.animations, char.clips?.run, 'Run');
    if (!idle || !walk || !run) return null;
    const mixer = new THREE.AnimationMixer(model);
    const actions: Record<AnimState, THREE.AnimationAction> = {
      idle: mixer.clipAction(idle),
      walk: mixer.clipAction(walk),
      run: mixer.clipAction(run),
    };
    return { mixer, actions };
  }, [gltf.animations, char.clips, model]);

  useEffect(() => {
    if (!anim) {
      console.warn(`[LUMEN] 角色「${char.name}」缺少 Idle/Walk/Run 动画 clip，已回退为内置人台。`);
      markCharacterFailed(char.id);
    }
  }, [anim, char.id, char.name, markCharacterFailed]);

  const state = useRef<AnimState>('idle');

  // 启动：Idle 立即播放；卸载：停止动画并还原材质（保持 drei 缓存干净）
  useEffect(() => {
    if (!anim) return;
    state.current = 'idle';
    anim.actions.idle.reset().play();
    return () => {
      anim.mixer.stopAllAction();
      anim.mixer.uncacheRoot(model);
      for (const rec of fadeMats) {
        rec.m.opacity = 1;
        rec.m.transparent = rec.transparent;
      }
    };
  }, [anim, model, fadeMats]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    // 原地淡入
    if (fadeK.current < 1) {
      fadeK.current = Math.min(1, fadeK.current + dt / FADE_IN);
      const k = fadeK.current;
      // three.js 材质只能命令式修改（R3F 惯例），此处为逐帧淡入
      // eslint-disable-next-line react-hooks/immutability
      for (const rec of fadeMats) rec.m.opacity = k;
      if (k >= 1) for (const rec of fadeMats) rec.m.transparent = rec.transparent; // 还原，避免长期透明排序开销
    }
    if (!anim) return;
    // 状态机：速度 <0.1 待机 / <3.1 行走 / 否则疾跑
    const speed = playerRef.speed;
    const want: AnimState = speed < 0.1 ? 'idle' : speed < RUN_SPEED ? 'walk' : 'run';
    if (want !== state.current) {
      const prev = anim.actions[state.current];
      const next = anim.actions[want];
      next.reset(); // reset() 内部会置 enabled=true、time=0
      next.crossFadeFrom(prev, CROSS_FADE, false); // 0.25s 平滑过渡
      next.play();
      state.current = want;
    }
    anim.mixer.update(dt);
  });

  if (!anim) return null; // clip 缺失 → effect 里标记失败，父组件下一帧回退人台
  return <primitive object={model} scale={scale} position={[0, footY, 0]} />;
}

/* ------------------------------------------------------------------ */
/* 内置程序化陶瓷人台（gallery.md §8，无 GLB 时的回退角色）               */
/* ------------------------------------------------------------------ */
function MannequinBody({ rigRef }: { rigRef: React.RefObject<THREE.Group | null> }) {
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  const headWander = useRef(0);
  const wanderTarget = useRef(0);
  const wanderTimer = useRef(0);

  const ceramic = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: MAT.avatar,
        roughness: 0.8,
        emissive: MAT.avatar,
        emissiveIntensity: 0.06,
      }),
    [],
  );
  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: MAT.brass, roughness: 0.35, metalness: 0.85 }),
    [],
  );

  useFrame((_, dt) => {
    const b = body.current;
    if (!b) return;
    t.current += dt;

    const speedRatio = Math.min(1, playerRef.speed / 3.0);
    const running = playerRef.running && speedRatio > 0.5;
    const walking = speedRatio > 0.05;

    // 待机呼吸 / 行走起伏
    let yOff = 0;
    let lean = 0;
    if (walking) {
      const freq = running ? 3.4 : 2.2;
      const amp = running ? 0.05 : 0.035;
      yOff = Math.abs(Math.sin(t.current * freq * Math.PI)) * amp * speedRatio;
      lean = (running ? 7 : 4) * (Math.PI / 180) * speedRatio;
    } else {
      b.scale.y = 1 + 0.008 * Math.sin((t.current / 2.4) * Math.PI * 2);
    }
    b.position.y = yOff;
    b.rotation.x = THREE.MathUtils.lerp(b.rotation.x, lean, 0.2);

    // 头部随机游走 ±2°
    wanderTimer.current -= dt;
    if (wanderTimer.current <= 0) {
      wanderTimer.current = 2.5 + Math.random() * 2.5;
      wanderTarget.current = ((Math.random() - 0.5) * 2 * (2 * Math.PI)) / 180;
    }
    headWander.current = THREE.MathUtils.lerp(headWander.current, wanderTarget.current, dt * 2);
    if (head.current) {
      // 头部先行 15%（视线引导）：身体与目标朝向差的一部分先由头补上
      const dy = playerRef.yaw - (rigRef.current?.rotation.y ?? playerRef.yaw);
      head.current.rotation.y = headWander.current + dy * 0.15;
      head.current.rotation.x = -0.052; // 微后仰 3°
    }
    // 颈环反相延迟（惯性错觉）
    if (ring.current) ring.current.position.y = 1.42 - yOff * 0.6;
  });

  return (
    <group ref={body}>
      {/* 裙摆圆台（离地 0.05） */}
      <mesh position={[0, 0.35, 0]} material={ceramic} castShadow>
        <cylinderGeometry args={[0.13, 0.25, 0.6, 20]} />
      </mesh>
      {/* 胶囊躯干（肩宽 0.46 收腰 0.36） */}
      <mesh position={[0, 1.0, 0]} material={ceramic} castShadow>
        <capsuleGeometry args={[0.21, 0.62, 6, 16]} />
      </mesh>
      {/* 黄铜颈环 */}
      <mesh ref={ring} position={[0, 1.42, 0]} material={brass} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.065, 0.014, 10, 24]} />
      </mesh>
      {/* 头部 Ø0.24 */}
      <mesh ref={head} position={[0, 1.58, 0]} material={ceramic} castShadow>
        <sphereGeometry args={[0.12, 20, 16]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar 根：共享出生升起 / 第一人称隐藏 / 位置朝向逻辑                    */
/* ------------------------------------------------------------------ */
export default function Avatar() {
  const group = useRef<THREE.Group>(null);
  const blob = useMemo(() => shadowBlobTexture(), []);
  const riseK = useRef(0); // 出生升起动画 0→1

  const characters = useStore((s) => s.characters);
  const characterId = useStore((s) => s.characterId);
  const failedCharacters = useStore((s) => s.failedCharacters);

  // 解析当前角色：本地选择 → default → 列表首项 → null（纯人台）
  const char = useMemo(() => {
    if (!characters) return null;
    const id = characterId ?? characters.default;
    return (
      characters.characters.find((c) => c.id === id) ??
      characters.characters.find((c) => c.id === characters.default) ??
      characters.characters[0] ??
      null
    );
  }, [characters, characterId]);

  const useGlb = !!char && !!char.src && !failedCharacters.includes(char.id);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const st = useStore.getState();

    // 出生"升起"（entering→explore 后 0.5s easeOutCubic）
    const born =
      st.appState === 'explore' ||
      st.appState === 'modal' ||
      st.appState === 'lightbox' ||
      st.appState === 'help' ||
      st.appState === 'characters';
    if (born && riseK.current < 1) riseK.current = Math.min(1, riseK.current + dt / 0.5);
    const rk = 1 - Math.pow(1 - riseK.current, 3);

    // 第一人称隐藏整身
    const firstPerson = st.cameraMode === 'first';
    g.visible = !firstPerson && rk > 0.01;
    if (!g.visible) return;

    g.position.set(playerRef.x, -0.1 * (1 - rk), playerRef.z);

    // 身体朝向 lerp（角速度 10 rad/s）；GLB 角色与人台均为 +Z 朝前建模
    let dy = playerRef.yaw - g.rotation.y;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    g.rotation.y += THREE.MathUtils.clamp(dy, -10 * dt, 10 * dt);
  });

  return (
    <group ref={group}>
      {useGlb ? <CharacterBody key={char.id} char={char} /> : <MannequinBody rigRef={group} />}
      {/* 假投影 Ø0.9（两种角色共用，贴地感） */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial map={blob} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}
