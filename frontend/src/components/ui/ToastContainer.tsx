import React, { useEffect, useState } from 'react';
import { Toast, ToastManager, ToastProps } from './Toast';

/**
 * Toast 容器组件
 * 在应用根部渲染，显示所有 Toast 通知
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  useEffect(() => {
    const unsubscribe = ToastManager.subscribe(() => {
      setToasts(ToastManager.getAll());
    });

    return () => { unsubscribe(); };
  }, []);

  return (
    <div style={styles.container}>
      {toasts.map((toast, index) => (
        <div key={index} style={styles.toastWrapper}>
          <Toast {...toast} />
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    pointerEvents: 'none',
  },
  toastWrapper: {
    pointerEvents: 'auto',
  },
};
