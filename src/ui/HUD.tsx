/**
 * HUD.tsx — 视图 2 的 DOM 层组装（overlay.md §1 z-index 架构）。
 * 入场运镜结束后挂载，各元件自带 stagger 入场动效。
 * 根层 pointer-events:none，交互元件各自恢复 pointer-events（不遮挡画布操控）。
 */
import { useStore } from '@/state/store';
import TopBar from './TopBar';
import ZoneLabel from './ZoneLabel';
import Minimap from './Minimap';
import ControlHints from './ControlHints';
import HintChip from './HintChip';
import MobileControls from './MobileControls';
import Crosshair from './Crosshair';

export default function HUD() {
  const appState = useStore((s) => s.appState);
  const show =
    appState === 'explore' ||
    appState === 'modal' ||
    appState === 'help' ||
    appState === 'lightbox' ||
    appState === 'characters';
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <TopBar />
      <ZoneLabel />
      <Minimap />
      <ControlHints />
      <HintChip />
      <MobileControls />
      <Crosshair />
    </div>
  );
}
