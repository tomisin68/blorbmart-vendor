import { useMemo, useState } from 'react';
import type { FoodItem } from '../../data/mock';

interface MenuScreenProps {
  foodItems: FoodItem[];
  onOpenAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleAvail: (id: string) => void;
}

export function MenuScreen({ foodItems, onOpenAdd, onEdit, onDelete, onToggleAvail }: MenuScreenProps) {
  const [catFilter, setCatFilter] = useState<'all' | FoodItem['cat']>('all');
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    return foodItems.filter((it) => {
      const catOk = catFilter === 'all' || it.cat === catFilter;
      const q = query.toLowerCase();
      const searchOk = !q || it.name.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [foodItems, catFilter, query]);

  const total = foodItems.length;
  const avail = foodItems.filter((f) => f.avail === 'available').length;
  const sold = foodItems.filter((f) => f.avail === 'soldout').length;
  const hidden = foodItems.filter((f) => f.avail === 'hidden').length;

  const tagLabel: Record<string, string> = {
    popular: 'Popular',
    bestseller: 'Best Seller',
    spicy: 'Spicy',
    vegan: 'Vegan',
    new: 'New',
  };

  return (
    <div id="screen-menu" className="screen">
      <div className="fu">
        <div className="page-header">
          <div className="stack-sm">
            <div className="page-eyebrow">Menu Management</div>
            <div className="page-title">Make editing the menu feel fast and obvious.</div>
            <div className="page-subtitle">Vendors should be able to spot sold-out items, search quickly, and add or update meals without hunting around the page.</div>
          </div>
          <button className="btn btn-primary" onClick={onOpenAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Add Menu Item
          </button>
        </div>

        <div className="quick-grid" style={{ marginBottom: 22 }}>
          <div className="metric-card"><div className="metric-label">Total Items</div><div className="metric-value">{total}</div><div className="metric-note">Everything currently listed.</div></div>
          <div className="metric-card"><div className="metric-label">Available</div><div className="metric-value" style={{ color: 'var(--gr)' }}>{avail}</div><div className="metric-note">Ready for customers to order.</div></div>
          <div className="metric-card"><div className="metric-label">Sold Out</div><div className="metric-value" style={{ color: 'var(--ye)' }}>{sold}</div><div className="metric-note">Needs restock or prep attention.</div></div>
          <div className="metric-card"><div className="metric-label">Hidden</div><div className="metric-value" style={{ color: 'var(--t1)' }}>{hidden}</div><div className="metric-note">Not visible to buyers right now.</div></div>
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input className="inp" placeholder="Search by item name or description" style={{ paddingLeft: 34 }} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {(['all', 'rice', 'protein', 'soup', 'drinks'] as const).map((cat) => (
                <button
                  key={cat}
                  className={`btn btn-sm ${catFilter === cat ? 'btn-primary' : 'btn-ghost'} menu-cat-btn`}
                  onClick={() => setCatFilter(cat)}
                >
                  {cat === 'all' ? 'All Items' : cat === 'rice' ? 'Rice & Swallow' : cat === 'protein' ? 'Proteins' : cat === 'soup' ? 'Soups' : 'Drinks'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div id="menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(265px,1fr))', gap: 14 }}>
          {items.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              No menu items match this filter yet.
            </div>
          )}
          {items.map((item) => {
            const isOut = item.avail === 'soldout';
            const isHidden = item.avail === 'hidden';
            const statusLabel = isHidden ? 'Hidden' : isOut ? 'Sold Out' : 'Available';
            const statusClass = isHidden ? 'chip-yellow' : isOut ? 'chip-red' : 'chip-green';

            return (
              <div className="card" key={item.id} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 128, background: 'linear-gradient(135deg,var(--s3),var(--s4))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 52, flexShrink: 0 }}>
                  {item.emoji}
                  <div style={{ position: 'absolute', inset: 0, background: isHidden || isOut ? 'rgba(0,0,0,.35)' : 'linear-gradient(to top,rgba(0,0,0,.18),transparent)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    <span className={`chip ${statusClass}`}>{statusLabel}</span>
                  </div>
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 5 }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', background: 'rgba(0,0,0,.6)', borderColor: 'transparent', backdropFilter: 'blur(4px)' }} onClick={() => onEdit(item.id)} title="Edit item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z" /></svg>
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', background: 'rgba(0,0,0,.6)', borderColor: 'transparent', backdropFilter: 'blur(4px)' }} onClick={() => onDelete(item.id)} title="Remove item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--re)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    </button>
                  </div>
                </div>

                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.3, flex: 1 }}>{item.name}</div>
                    <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 16, color: 'var(--or)', flexShrink: 0 }}>₦{item.price.toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.desc || 'No description added yet.'}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
                    {item.tags.length === 0 && <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>No tags</span>}
                    {item.tags.map((t) => (
                      <span key={t} style={{ fontSize: 10, background: 'var(--s4)', color: 'var(--t2)', padding: '3px 8px', borderRadius: 999, fontWeight: 600 }}>{tagLabel[t] || t}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--b1)', gap: 8 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>Prep time: {item.prep} mins</span>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '6px 10px' }} onClick={() => onToggleAvail(item.id)}>
                      {isOut ? 'Mark Available' : isHidden ? 'Unhide Item' : 'Mark Sold Out'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
