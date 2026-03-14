import type { PageKey } from '../../types/ui';

interface SidebarProps {
  page: PageKey;
  onNavigate: (page: PageKey) => void;
  ordersBadge: number;
  notifBadge: number;
  open: boolean;
  onSignOut: () => void;
}

export function Sidebar({ page, onNavigate, ordersBadge, notifBadge, open, onSignOut }: SidebarProps) {
  return (
    <aside id="sidebar" className={open ? 'open' : ''}>
      <div className="sb-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="sb-logo">B</div>
          <div>
            <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 14, lineHeight: 1.1 }}>Blorbmart</div>
            <div style={{ fontSize: 10, color: 'var(--or)', fontWeight: 600, marginTop: 2, letterSpacing: '.04em' }}>KITCHEN PORTAL</div>
          </div>
        </div>
      </div>

      <div className="sb-kitchen">
        <div className="sb-avatar">MK</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Mama's Kitchen</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>Ikeja, Lagos</div>
        </div>
        <span className="chip chip-green" style={{ marginLeft: 'auto', fontSize: 9 }}>● Live</span>
      </div>

      <nav className="sb-nav">
        <div className="sb-section">Menu</div>
        <button className={`nav-item ${page === 'overview' ? 'active' : ''}`} onClick={() => onNavigate('overview')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" /></svg>
          Overview
        </button>
        <button className={`nav-item ${page === 'menu' ? 'active' : ''}`} onClick={() => onNavigate('menu')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 017 7c0 4-3 6-4 9H9c-1-3-4-5-4-9a7 7 0 017-7z" /><path d="M9 18h6M10 22h4" /></svg>
          Menu & Food
        </button>
        <button className={`nav-item ${page === 'orders' ? 'active' : ''}`} onClick={() => onNavigate('orders')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /><path d="M9 12h6M9 16h4" /></svg>
          Orders
          {ordersBadge > 0 && <span className="nav-badge">{ordersBadge}</span>}
        </button>
        <button className={`nav-item ${page === 'hours' ? 'active' : ''}`} onClick={() => onNavigate('hours')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          Hours &amp; Status
        </button>
        <button className={`nav-item ${page === 'txns' ? 'active' : ''}`} onClick={() => onNavigate('txns')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
          Transactions
        </button>
        <button className={`nav-item ${page === 'withdrawals' ? 'active' : ''}`} onClick={() => onNavigate('withdrawals')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg>
          Withdrawals
        </button>
        <button className={`nav-item ${page === 'bank' ? 'active' : ''}`} onClick={() => onNavigate('bank')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" /></svg>
          Bank Account
        </button>
        <button className={`nav-item ${page === 'security' ? 'active' : ''}`} onClick={() => onNavigate('security')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          Security & PIN
        </button>
        <button className={`nav-item ${page === 'notifs' ? 'active' : ''}`} onClick={() => onNavigate('notifs')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3C7.7 6.2 6 8.4 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          Notifications
          {notifBadge > 0 && <span className="nav-badge">{notifBadge}</span>}
        </button>
      </nav>

      <div className="sb-balance">
        <div className="sb-bal-card">
          <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Available</div>
          <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 15, color: 'var(--or)' }}>₦284,500</div>
        </div>
        <button className="nav-item" style={{ color: 'var(--re)', border: '1px solid transparent' }} onClick={onSignOut}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
