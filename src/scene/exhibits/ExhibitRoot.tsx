/**
 * ExhibitRoot.tsx — 展品根组件：读配置分发到五种 mount 构件，
 * 并挂载 FocusRing、ExhibitSpot、点击/悬停交互。
 *
 * 交互规则（gallery.md §10/§13）：
 * - 左键点击 / 触屏点按展品 → 射线命中即打开详情（无需先聚焦）；
 * - 打开详情前请求"观赏位"运镜（0.8s），由相机系统执行。
 */
import { useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { Exhibit } from '@/config/schema';
import { useStore, playerRef } from '@/state/store';
import { computeViewSpot } from '@/systems/interaction';
import WallFrame from './WallFrame';
import Pedestal from './Pedestal';
import Vitrine from './Vitrine';
import Screen from './Screen';
import Panel from './Panel';
import FocusRing from '@/scene/FocusRing';
import ExhibitSpot from '@/scene/lighting/ExhibitSpot';

/** 记录最近一次展品点击时间（用于区分"点展品"与"点画布锁鼠标"） */
export let lastExhibitClickAt = 0;

/** 打开展品详情：请求观赏位运镜 + store 进入 modal 态 */
export function openExhibit(e: Exhibit): void {
  const st = useStore.getState();
  if (st.appState !== 'explore') return;
  const spot = computeViewSpot(e, playerRef.x, playerRef.z);
  playerRef.focusMove = {
    x: spot.x,
    z: spot.z,
    lookX: e.position[0],
    lookY: e.position[1] || 1.2,
    lookZ: e.position[2],
    t: 0,
  };
  st.openModal(e.id);
}

export default function ExhibitRoot({ exhibit: e }: { exhibit: Exhibit }) {
  const rotY = ((e.rotationDeg ?? 0) * Math.PI) / 180;

  const onClick = useCallback(
    (ev: ThreeEvent<MouseEvent>) => {
      ev.stopPropagation();
      lastExhibitClickAt = Date.now();
      openExhibit(e);
    },
    [e],
  );
  const onOver = useCallback((ev: ThreeEvent<PointerEvent>) => {
    ev.stopPropagation();
    document.body.style.cursor = 'pointer';
  }, []);
  const onOut = useCallback(() => {
    document.body.style.cursor = 'default';
  }, []);

  const isWall = e.mount === 'wall-frame' || e.mount === 'screen' || e.mount === 'panel';

  return (
    <group
      position={e.position}
      rotation={[0, rotY, 0]}
      userData={{ exhibitId: e.id }}
      onClick={onClick}
      onPointerOver={onOver}
      onPointerOut={onOut}
    >
      {e.mount === 'wall-frame' && <WallFrame exhibit={e} />}
      {e.mount === 'pedestal' && <Pedestal exhibit={e} big={e.id === 'C-01'} />}
      {e.mount === 'vitrine' && <Vitrine exhibit={e} />}
      {e.mount === 'screen' && <Screen exhibit={e} />}
      {e.mount === 'panel' && <Panel exhibit={e} />}

      {/* 聚焦地环：墙面件在墙前 0.75m，座地件环绕基座 */}
      {isWall ? (
        <group position={[0, 0.02 - e.position[1], 0.75]}>
          <FocusRing exhibitId={e.id} radius={0.55} />
        </group>
      ) : (
        <FocusRing exhibitId={e.id} radius={e.mount === 'pedestal' && e.id === 'C-01' ? 0.85 : 0.62} />
      )}

      {/* 轨道射灯（按需激活） */}
      {e.spotlight && <ExhibitSpot exhibit={e} />}
    </group>
  );
}
