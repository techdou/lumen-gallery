/**
 * useGalleryLoader.ts — 展览数据 + 角色数据加载与预载（overlay.md §2 加载逻辑）。
 * 流程：并行拉取 exhibits.json 与 characters.json → zod 校验（坏数据中文警告跳过/回退）→
 * 并发预载全部展品图、视频海报与角色 GLB（计入同一进度）→
 * progress = 已就绪项/总项（禁止 100% 前跳满，LoadingOverlay 侧做 0.3s 平滑）。
 * 角色 GLB 通过 GLTFLoader.loadAsync 预载并开启 THREE.Cache，
 * Avatar 组件内 useGLTF 命中缓存秒切（同时调 useGLTF.preload 预热 drei 缓存）。
 */
import { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useGLTF } from '@react-three/drei';
import { parseExhibitsFile, parseCharactersFile, FALLBACK_CHARACTERS } from '@/config/schema';
import { useStore } from '@/state/store';
import { assetUrl } from '@/utils/asset';

// 开启 three 全局内存缓存：加载期预载的 GLB，运行时 useGLTF 直接命中、不再发网络请求
THREE.Cache.enabled = true;

function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => {
      console.warn(`[LUMEN] 素材加载失败（将显示占位）：${src}`);
      resolve(); // 失败不阻断，3D/弹窗侧显示占位
    };
    img.src = src;
  });
}

export function useGalleryLoader() {
  const setData = useStore((s) => s.setData);
  const setCharacters = useStore((s) => s.setCharacters);
  const setCharacterId = useStore((s) => s.setCharacterId);
  const markCharacterFailed = useStore((s) => s.markCharacterFailed);
  const setProgress = useStore((s) => s.setProgress);
  const setReady = useStore((s) => s.setReady);
  const setMobile = useStore((s) => s.setMobile);

  useEffect(() => {
    let alive = true;
    // 移动端判定（一次性）
    setMobile(
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
        (navigator.hardwareConcurrency ?? 8) <= 4 ||
        window.innerWidth < 768,
    );

    (async () => {
      try {
        // 展览数据与角色数据并行拉取；角色配置缺失/损坏不阻断展览
        const [exRes, chRes] = await Promise.all([
          fetch('data/exhibits.json'),
          fetch('data/characters.json').catch(() => null),
        ]);
        const data = parseExhibitsFile(await exRes.json());
        let characters = FALLBACK_CHARACTERS;
        if (chRes && chRes.ok) {
          try {
            characters = parseCharactersFile(await chRes.json());
          } catch {
            console.warn('[LUMEN] characters.json 解析异常，已回退为内置人台角色。');
          }
        } else {
          console.warn('[LUMEN] 未找到 characters.json，已回退为内置人台角色。');
        }
        if (!alive) return;
        setData(data);
        setCharacters(characters);

        // 角色 id 校验：本地记忆的角色不存在时回退 default
        const savedId = useStore.getState().characterId;
        if (!savedId || !characters.characters.some((c) => c.id === savedId)) {
          if (savedId) console.warn(`[LUMEN] 本地记忆的角色「${savedId}」已不存在，回退默认角色「${characters.default}」。`);
          setCharacterId(characters.default);
        }

        // 预载清单：展品图 + 视频海报 + 展品 model GLB + 角色 GLB（合并计入同一进度条）
        const jobs: (() => Promise<void>)[] = [];
        for (const e of data.exhibits) {
          if (e.type === 'image' && e.src) jobs.push(() => loadImage(assetUrl(e.src)));
          if (e.type === 'video' && e.poster) jobs.push(() => loadImage(assetUrl(e.poster)));
          if (e.type === 'model' && e.src) {
            // 展品 GLB：预载入 THREE.Cache + 预热 drei，避免走近展台才触发加载
            const url = assetUrl(e.src);
            jobs.push(async () => {
              try {
                await new GLTFLoader().loadAsync(url);
                if (!alive) return;
                useGLTF.preload(url);
              } catch {
                console.warn(`[LUMEN] 展品「${e.id}」模型加载失败，将回退为程序化雕塑：${url}`);
              }
            });
          }
        }
        for (const c of characters.characters) {
          if (!c.src) continue; // 内置人台无需预载
          const url = assetUrl(c.src);
          jobs.push(async () => {
            try {
              await new GLTFLoader().loadAsync(url);
              if (!alive) return;
              useGLTF.preload(url); // 预热 drei 缓存（命中 THREE.Cache，无二次网络请求）
            } catch {
              console.warn(`[LUMEN] 角色「${c.name}」模型加载失败，已回退为内置人台：${url}`);
              if (alive) markCharacterFailed(c.id);
            }
          });
        }

        const total = jobs.length;
        if (total === 0) {
          // 无图片类展品且无角色模型（全 model/text/link）时直接就绪
          setProgress(1);
          setTimeout(() => alive && setReady(), 350);
          return;
        }
        let done = 0;
        await Promise.all(
          jobs.map((job) =>
            job().then(() => {
              if (!alive) return;
              done++;
              setProgress(done / total);
            }),
          ),
        );
        if (!alive) return;
        // 确保 100% 后再亮出进入按钮
        setProgress(1);
        setTimeout(() => alive && setReady(), 350);
      } catch (err) {
        console.error('[LUMEN] 展览数据加载失败：', err);
      }
    })();

    return () => {
      alive = false;
    };
  }, [setData, setCharacters, setCharacterId, markCharacterFailed, setProgress, setReady, setMobile]);
}
