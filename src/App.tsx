/**
 * App.tsx — LUMEN 流明 · 虚拟美术馆（单页沉浸式应用）。
 * 视图层：LoadingOverlay(70) > Lightbox(60) > ExhibitModal(50) > HelpPanel(40)
 *        > Toasts(30) > HUD(20) > Gallery Canvas(10)。
 */
import { AnimatePresence } from 'framer-motion';
import Gallery from '@/scene/Gallery';
import LoadingOverlay from '@/ui/LoadingOverlay';
import HUD from '@/ui/HUD';
import HelpPanel from '@/ui/HelpPanel';
import CharacterSelector from '@/ui/CharacterSelector';
import ExhibitModal from '@/ui/ExhibitModal';
import Lightbox from '@/ui/Lightbox';
import Toasts from '@/ui/Toasts';
import { useStore } from '@/state/store';
import { useGalleryLoader } from '@/hooks/useGalleryLoader';
import { useKeyboard } from '@/systems/controls/useKeyboard';

export default function App() {
  useGalleryLoader();
  useKeyboard();
  const appState = useStore((s) => s.appState);

  return (
    <>
      <Gallery />
      <HUD />
      <Toasts />
      <AnimatePresence>{appState === 'help' && <HelpPanel key="help" />}</AnimatePresence>
      <AnimatePresence>{appState === 'characters' && <CharacterSelector key="characters" />}</AnimatePresence>
      <ExhibitModal />
      <Lightbox />
      <LoadingOverlay />
    </>
  );
}
