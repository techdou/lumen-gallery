import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { useStore, playerRef } from './state/store'

// 开发期调试钩子：在浏览器 console 可直接操作
//   window.__lumen.teleport(16.5, 0)     // 站到大卫头像旁
//   window.__lumen.look(Math.PI / 2)     // 转向 +X（东）
//   window.__lumen.state()               // 查当前 store/playerRef 状态
if (import.meta.env.DEV) {
  ;(window as unknown as { __lumen: unknown }).__lumen = {
    teleport: (x: number, z: number) => {
      playerRef.x = x;
      playerRef.z = z;
    },
    look: (yaw: number) => {
      playerRef.camYaw = yaw;
      playerRef.yaw = yaw;
    },
    state: () => ({
      appState: useStore.getState().appState,
      player: { x: playerRef.x, z: playerRef.z, yaw: playerRef.yaw, camYaw: playerRef.camYaw },
    }),
    store: useStore,
    playerRef,
  };
  console.info('[LUMEN] dev hook ready: window.__lumen { teleport, look, state }');
}

// 注意：不使用 StrictMode（会导致 Canvas 效果重复执行）
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
