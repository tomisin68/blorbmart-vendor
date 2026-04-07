import type { Order } from '../../data/mock';

interface OrdersScreenProps {
  orders: Order[];
  activeTab: Order['status'];
  onTabChange: (tab: Order['status']) => void;
  onAdvance: (id: string) => void;
  onReject: (id: string) => void;
  kitchenOpen: boolean;
  onGoHours: () => void;
}

const ORDER_FLOW = {
  new: { action: 'Accept Order', chipCls: 'chip-yellow', chipLabel: 'New Order' },
  accepted: { action: 'Mark as Ready', chipCls: 'chip-blue', chipLabel: 'Preparing' },
  ready: { action: 'Dispatch Order', chipCls: 'chip-orange', chipLabel: 'Ready for Pickup' },
  picked: { action: 'Mark Delivered', chipCls: 'chip-green', chipLabel: 'Out for Delivery' },
  done: { action: null, chipCls: 'chip-green', chipLabel: 'Delivered' },
} as const;

export function OrdersScreen({ orders, activeTab, onTabChange, onAdvance, onReject, kitchenOpen, onGoHours }: OrdersScreenProps) {
  const tabs: Order['status'][] = ['new', 'accepted', 'ready', 'picked', 'done'];
  const counts = tabs.reduce((acc, tab) => ({ ...acc, [tab]: orders.filter((o) => o.status === tab).length }), {} as Record<Order['status'], number>);
  const filtered = orders.filter((o) => o.status === activeTab);

  return (
    <div id="screen-orders" className="screen">
      <div className="fu">
        <div className="page-header">
          <div className="stack-sm">
            <div className="page-eyebrow">Order Desk</div>
            <div className="page-title">Make next actions impossible to miss.</div>
            <div className="page-subtitle">The orders view should help vendors decide quickly: accept, prepare, dispatch, or confirm delivery without reading too much.</div>
          </div>
          <div className="surface-note" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div id="kitchen-live-dot" style={{ width: 9, height: 9, borderRadius: '50%', background: kitchenOpen ? 'var(--gr)' : 'var(--ye)', boxShadow: kitchenOpen ? '0 0 8px var(--gr)' : '0 0 8px var(--ye)', animation: 'glow 1.8s ease-in-out infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: kitchenOpen ? 'var(--gr)' : 'var(--ye)' }} id="kitchen-status-label">{kitchenOpen ? 'Kitchen Open' : 'Kitchen Paused'}</span>
            <button className="btn btn-ghost btn-sm" onClick={onGoHours}>Change Status</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--s2)', borderRadius: 'var(--r2)', padding: 4, border: '1px solid var(--b1)', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              className="btn order-tab"
              onClick={() => onTabChange(tab)}
              style={{
                flex: 1,
                justifyContent: 'center',
                borderRadius: 10,
                background: activeTab === tab ? 'var(--or)' : 'none',
                color: activeTab === tab ? '#fff' : 'var(--t2)',
                boxShadow: activeTab === tab ? '0 2px 10px rgba(249,115,22,.3)' : 'none',
                minWidth: 120,
              }}
            >
              {tab === 'new' ? 'New' : tab === 'accepted' ? 'Preparing' : tab === 'ready' ? 'Ready' : tab === 'picked' ? 'Delivery' : 'Done'}
              <span className="order-tab-ct" style={{ background: activeTab === tab ? 'rgba(255,255,255,.25)' : 'var(--s4)', color: activeTab === tab ? '#fff' : 'var(--t2)' }}>
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        <div id="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div className="empty-state">
              No {activeTab === 'new' ? 'new' : activeTab} orders right now.
            </div>
          )}
          {filtered.map((order) => {
            const flow = ORDER_FLOW[order.status];
            const isNew = order.status === 'new';
            const isDone = order.status === 'done';
            return (
              <div className="card" key={order.id} style={{ borderLeft: `4px solid ${isNew ? 'var(--ye)' : isDone ? 'var(--gr)' : 'var(--or)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 16 }}>{order.id}</span>
                      <span className={`chip ${flow.chipCls}`}>{flow.chipLabel}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>{order.customer}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--t2)', marginTop: 3 }}>
                      <svg style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {order.addr}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 19, color: 'var(--or)' }}>₦{order.total.toLocaleString()}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--t2)', marginTop: 3 }}>{order.placed}</div>
                  </div>
                </div>

                <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '12px 13px', marginBottom: 12 }}>
                  {order.items.map((it) => (
                    <div key={`${order.id}-${it.name}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '5px 0', borderBottom: '1px solid var(--b1)' }}>
                      <span style={{ color: 'var(--t2)' }}>{it.qty}x {it.name}</span>
                      <span style={{ fontWeight: 700 }}>₦{(it.qty * it.price).toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, paddingTop: 9, fontWeight: 800 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--or)' }}>₦{order.total.toLocaleString()}</span>
                  </div>
                </div>

                {order.note && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, background: 'var(--yeg)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 'var(--r3)', padding: '8px 12px', fontSize: 12, color: 'var(--ye)', marginBottom: 12 }}>
                    <svg style={{ flexShrink: 0, marginTop: 1 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                    <span><b>Customer note:</b> {order.note}</span>
                  </div>
                )}

                {!isDone ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {isNew && (
                      <button className="btn btn-danger btn-sm" onClick={() => onReject(order.id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                        Reject
                      </button>
                    )}
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onAdvance(order.id)}>
                      {flow.action}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--gr)', fontSize: 13, fontWeight: 700 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gr)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                    Delivered successfully
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
