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
  new: { next: 'accepted', action: 'Accept Order', chipCls: 'chip-yellow', chipLabel: 'New' },
  accepted: { next: 'ready', action: 'Mark as Ready', chipCls: 'chip-blue', chipLabel: 'Preparing' },
  ready: { next: 'picked', action: 'Dispatched ✓', chipCls: 'chip-orange', chipLabel: 'Ready for Pickup' },
  picked: { next: 'done', action: 'Mark Delivered', chipCls: 'chip-green', chipLabel: 'Out for Delivery' },
  done: { next: null, action: null, chipCls: 'chip-green', chipLabel: 'Delivered' },
} as const;

export function OrdersScreen({ orders, activeTab, onTabChange, onAdvance, onReject, kitchenOpen, onGoHours }: OrdersScreenProps) {
  const tabs: Order['status'][] = ['new', 'accepted', 'ready', 'picked', 'done'];

  const counts = tabs.reduce((acc, tab) => ({ ...acc, [tab]: orders.filter((o) => o.status === tab).length }), {} as Record<Order['status'], number>);

  const filtered = orders.filter((o) => o.status === activeTab);

  return (
    <div id="screen-orders" className="screen">
      <div className="fu">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Orders</div>
            <div style={{ color: 'var(--t3)', fontSize: 13 }}>Accept incoming orders and manage fulfilment</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div id="kitchen-live-dot" style={{ width: 9, height: 9, borderRadius: '50%', background: kitchenOpen ? 'var(--gr)' : 'var(--ye)', boxShadow: kitchenOpen ? '0 0 8px var(--gr)' : '0 0 8px var(--ye)', animation: 'glow 1.8s ease-in-out infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: kitchenOpen ? 'var(--gr)' : 'var(--ye)' }} id="kitchen-status-label">{kitchenOpen ? 'Kitchen Open' : 'Kitchen Paused'}</span>
            <button className="btn btn-ghost btn-sm" onClick={onGoHours}>Change Status</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--s2)', borderRadius: 'var(--r2)', padding: 4, border: '1px solid var(--b1)' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              className="btn order-tab"
              onClick={() => onTabChange(tab)}
              style={{
                flex: 1,
                justifyContent: 'center',
                borderRadius: 8,
                background: activeTab === tab ? 'var(--or)' : 'none',
                color: activeTab === tab ? '#fff' : 'var(--t2)',
                boxShadow: activeTab === tab ? '0 2px 10px rgba(255,107,43,.3)' : 'none',
              }}
            >
              {tab === 'new' ? 'New' : tab === 'accepted' ? 'Preparing' : tab === 'ready' ? 'Ready' : tab === 'picked' ? 'Out for Delivery' : 'Completed'}
              <span
                className="order-tab-ct"
                style={{ background: activeTab === tab ? 'rgba(255,255,255,.25)' : 'var(--s4)', color: activeTab === tab ? '#fff' : 'var(--t2)' }}
              >
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        <div id="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '52px 0', color: 'var(--t3)' }}>
              <svg style={{ display: 'block', margin: '0 auto 12px' }} width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              No {activeTab === 'new' ? 'new' : activeTab} orders
            </div>
          )}
          {filtered.map((order) => {
            const flow = ORDER_FLOW[order.status];
            const isNew = order.status === 'new';
            const isDone = order.status === 'done';
            return (
              <div className="card" key={order.id} style={{ borderLeft: `3px solid ${isNew ? 'var(--ye)' : isDone ? 'var(--gr)' : 'var(--or)'}`, transition: 'border-color .2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 15 }}>{order.id}</span>
                      <span className={`chip ${flow.chipCls}`}>{flow.chipLabel}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--t2)' }}>{order.customer}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>
                      <svg style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {order.addr}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 18, color: 'var(--or)' }}>₦{order.total.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{order.placed}</div>
                  </div>
                </div>

                <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '10px 12px', marginBottom: 12 }}>
                  {order.items.map((it) => (
                    <div key={it.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 0', borderBottom: '1px solid var(--b1)' }}>
                      <span style={{ color: 'var(--t2)' }}>{it.qty}× {it.name}</span>
                      <span style={{ fontWeight: 600 }}>₦{(it.qty * it.price).toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, paddingTop: 8, fontWeight: 700 }}>
                    <span>Total</span><span style={{ color: 'var(--or)' }}>₦{order.total.toLocaleString()}</span>
                  </div>
                </div>

                {order.note && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, background: 'var(--yeg)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 'var(--r3)', padding: '8px 12px', fontSize: 12, color: 'var(--ye)', marginBottom: 12 }}>
                    <svg style={{ flexShrink: 0, marginTop: 1 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                    <span><b>Note:</b> {order.note}</span>
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
                      {isNew && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
                      {flow.action}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--gr)', fontSize: 13, fontWeight: 600 }}>
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
