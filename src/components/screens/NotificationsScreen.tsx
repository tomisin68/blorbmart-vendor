import type { Notif } from '../../data/mock';

interface NotificationsScreenProps {
  notifs: Notif[];
  onRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationsScreen({ notifs, onRead, onMarkAllRead }: NotificationsScreenProps) {
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div id="screen-notifs" className="screen">
      <div className="fu">
        <div className="page-header">
          <div className="stack-sm">
            <div className="page-eyebrow">Updates</div>
            <div className="page-title">Keep important alerts easy to spot.</div>
            <div className="page-subtitle">{unread} unread. Payments, reviews, and operational updates should feel visible without overwhelming the vendor.</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onMarkAllRead}>Mark all as read</button>
        </div>
        <div className="card" id="notif-list">
          {notifs.length === 0 && <div className="empty-state">You have no notifications yet.</div>}
          {notifs.map((n) => (
            <div className={`notif-row ${n.read ? 'read' : ''}`} key={n.id} onClick={() => onRead(n.id)}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: n.read ? 'var(--s3)' : 'var(--org)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={n.read ? 'var(--t3)' : 'var(--or)'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3C7.7 6.2 6 8.4 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                {!n.read && <div style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: 'var(--or)', border: '1.5px solid var(--s1)' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3 }}>{n.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 5 }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
