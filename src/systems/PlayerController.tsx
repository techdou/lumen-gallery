/**
 * PlayerController.tsx — 玩家移动主循环（场景内每帧）：
 * 1. 读取键盘/摇杆输入 → 相机相对方向位移（3.0 m/s，Shift/摇杆满推 疾跑×1.8）；
 * 2. 胶囊碰撞求解（resolveMove，滑墙）；
 * 3. 区域判定（0.15s 节流）→ store.zone；首次进入触发"区域揭示"；
 * 4. 聚焦判定（0.1s 节流）→ store.focusedId；
 * 5. 点按射线回调注册（移动端点展品直接打开）。
 * 非 explore 状态：移动挂起（聚焦运镜除外，由 CameraDirector 处理）。
 */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { MOVE, INTERACT } from '@/config/site';
import { useStore, playerRef } from '@/state/store';
import { resolveMove } from '@/systems/collision';
import { zoneAt } from '@/systems/zones';
import { computeFocus } from '@/systems/interaction';
import { input } from '@/systems/controls/input';
import { openExhibit, lastExhibitClickAt } from '@/scene/exhibits/ExhibitRoot';

export default function PlayerController() {
  const { camera, scene } = useThree();
  const zoneTimer = useRef(0);
  const focusTimer = useRef(0);
  const revealTimer = useRef<string[]>([]);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  // 移动端点按：NDC → 射线 → 最近命中展品 → 打开详情
  useEffect(() => {
    input.tapHandler = (nx, ny) => {
      const st = useStore.getState();
      if (st.appState !== 'explore' || !st.data) return;
      raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (const h of hits) {
        let obj: THREE.Object3D | null = h.object;
        while (obj && !obj.userData.exhibitId) obj = obj.parent;
        if (obj) {
          const e = st.data.exhibits.find((x) => x.id === obj!.userData.exhibitId);
          if (e) {
            openExhibit(e);
            return;
          }
        }
      }
    };
    return () => {
      input.tapHandler = null;
    };
  }, [camera, scene, raycaster]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = useStore.getState();
    if (!st.data) return;

    // ---- 移动（漫游输入仅 explore 态生效；聚焦运镜期间挂起） ----
    if (st.appState === 'explore' && !playerRef.focusMove) {
      let ix = 0;
      let iz = 0;
      const k = input.keys;
      if (k.has('KeyW') || k.has('ArrowUp')) iz += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) iz -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) ix += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) ix -= 1;
      // 摇杆（y 向下为正 → 前推为负）
      iz += -input.joystick.y;
      ix += input.joystick.x;
      const mag = Math.hypot(ix, iz);
      if (mag > 0.01) {
        const norm = Math.min(1, mag);
        const yaw = playerRef.camYaw;
        // 相机相对方向：前向 forward=(sin yaw, cos yaw)，
        // 右向 right = forward × up = (-cos yaw, sin yaw)（右手系，0=面向+Z）
        const fx = Math.sin(yaw);
        const fz = Math.cos(yaw);
        const rx = -Math.cos(yaw);
        const rz = Math.sin(yaw);
        let mx = (fx * iz + rx * ix) / Math.max(1, mag);
        let mz = (fz * iz + rz * ix) / Math.max(1, mag);
        const running = k.has('ShiftLeft') || k.has('ShiftRight') || mag > 0.85;
        const speed = MOVE.walkSpeed * (running ? MOVE.runMultiplier : 1) * norm;
        const nx = playerRef.x + mx * speed * dt;
        const nz = playerRef.z + mz * speed * dt;
        // 胶囊碰撞求解（滑墙）
        const [sx, sz, hit] = resolveMove(nx, nz, MOVE.capsuleRadius);
        playerRef.x = sx;
        playerRef.z = sz;
        playerRef.speed = hit ? speed * 0.4 : speed;
        playerRef.running = running;
        // 身体朝向 = 移动方向
        playerRef.yaw = Math.atan2(mx, mz);
      } else {
        playerRef.speed = 0;
        playerRef.running = false;
      }
    } else {
      playerRef.speed = 0;
      playerRef.running = false;
    }

    // ---- 区域判定（0.15s 节流） ----
    zoneTimer.current -= dt;
    if (zoneTimer.current <= 0) {
      zoneTimer.current = 0.15;
      const zid = zoneAt(playerRef.x, playerRef.z, st.data.zones);
      if (zid !== st.zone) {
        st.setZone(zid);
        // 首次进入新区：记录以触发"区域揭示"（射灯组依次点亮由 ExhibitSpot 开馆逻辑复用）
        if (!revealTimer.current.includes(zid)) revealTimer.current.push(zid);
      }
    }

    // ---- 聚焦判定（0.1s 节流） ----
    focusTimer.current -= dt;
    if (focusTimer.current <= 0 && st.appState === 'explore') {
      focusTimer.current = INTERACT.focusThrottle;
      const focused = computeFocus(
        playerRef.x,
        playerRef.z,
        playerRef.camYaw,
        st.data.exhibits,
        st.cameraMode === 'first',
      );
      st.setFocused(focused?.id ?? null);
    }
  });

  return null;
}

export { lastExhibitClickAt };
