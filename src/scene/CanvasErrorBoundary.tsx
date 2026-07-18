/**
 * CanvasErrorBoundary.tsx — 3D 场景错误边界。
 *
 * R3F Canvas 内部抛错（如某展品 GLB 加载失败、几何/材质异常）会冒泡到
 * Canvas 外层；Suspense 只接 promise 不接 Error，没边界时整棵 React 树
 * 卸载 → 页面白屏。本组件捕获这类错误，回退为「3D 不可用」提示，
 * 让上层 UI（顶栏、帮助）继续可用，便于访客知道发生了什么。
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export default class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[LUMEN] 3D 场景渲染失败：', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1a1814',
            color: '#d4c9b3',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#f4f1ea' }}>
              3D 场景渲染失败
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7, lineHeight: 1.6 }}>
              可能是某件展品素材损坏或浏览器 WebGL 资源不足。
              <br />
              请刷新页面重试，或检查浏览器控制台了解详情。
            </p>
            <button
              onClick={() => location.reload()}
              style={{
                marginTop: '1.25rem',
                padding: '0.5rem 1.25rem',
                background: 'transparent',
                border: '1px solid #a67c3d',
                color: '#a67c3d',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
