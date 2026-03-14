interface ToastProps {
  visible: boolean;
  message: string;
  ok?: boolean;
}

export function Toast({ visible, message, ok = true }: ToastProps) {
  return (
    <div id="toast" className={visible ? 'show' : ''}>
      <div id="toast-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? 'var(--gr)' : 'var(--re)', flexShrink: 0 }} />
      <span id="toast-msg">{message}</span>
    </div>
  );
}
