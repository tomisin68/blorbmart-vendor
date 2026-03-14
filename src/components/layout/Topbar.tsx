interface TopbarProps {
  title: string;
  onHamburger: () => void;
  onNotifications: () => void;
  showBellDot: boolean;
}

export function Topbar({ title, onHamburger, onNotifications, showBellDot }: TopbarProps) {
  return (
    <header id="topbar">
      <button id="hamburger" onClick={onHamburger}>☰</button>
      <div id="topbar-title" style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 16, flex: 1 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" style={{ padding: '7px 10px', position: 'relative' }} onClick={onNotifications}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3C7.7 6.2 6 8.4 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          {showBellDot && <div className="ping-dot" id="bell-dot" />}
        </button>
        <div style={{ width: 31, height: 31, borderRadius: 8, background: 'var(--org)', border: '1px solid rgba(255,107,43,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 11, color: 'var(--or)' }}>MK</div>
      </div>
    </header>
  );
}
