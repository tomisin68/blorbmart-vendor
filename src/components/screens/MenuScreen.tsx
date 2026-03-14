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

  const tagLabel: Record<string, string> = {
    popular: '⭐ Popular',
    bestseller: '🔥 Best Seller',
    spicy: '🌶 Spicy',
    vegan: '🌿 Vegan',
    new: '✨ New',
  };

  return (
    <div id="screen-menu" className="screen">
      <div className="fu">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Menu &amp; Food</div>
            <div style={{ color: 'var(--t3)', fontSize: 13 }}>Manage your kitchen&apos;s food items and categories</div>
          </div>
          <button className="btn btn-primary" onClick={onOpenAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Add Food Item
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
          <div className="card" style={{ padding: '14px 16px' }}><div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Total Items</div><div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 20 }}>{total}</div></div>
          <div className="card" style={{ padding: '14px 16px' }}><div style={{ fontSize: 10, color: 'var(--gr)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Available</div><div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 20, color: 'var(--gr)' }}>{avail}</div></div>
          <div className="card" style={{ padding: '14px 16px' }}><div style={{ fontSize: 10, color: 'var(--ye)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Sold Out</div><div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 20, color: 'var(--ye)' }}>{sold}</div></div>
          <div className="card" style={{ padding: '14px 16px' }}><div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Categories</div><div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 20 }}>4</div></div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input className="inp" placeholder="Search food items…" style={{ paddingLeft: 34 }} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {(['all', 'rice', 'protein', 'soup', 'drinks'] as const).map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${catFilter === cat ? 'btn-primary' : 'btn-ghost'} menu-cat-btn`}
                onClick={() => setCatFilter(cat)}
              >
                {cat === 'all' ? 'All' : cat === 'rice' ? 'Rice & Swallow' : cat === 'protein' ? 'Proteins' : cat === 'soup' ? 'Soups' : 'Drinks'}
              </button>
            ))}
          </div>
        </div>

        <div id="menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(255px,1fr))', gap: 14 }}>
          {items.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: 'var(--t3)', fontSize: 14 }}>No food items found</div>
          )}
          {items.map((item) => {
            const isOut = item.avail === 'soldout';
            const isHidden = item.avail === 'hidden';
            return (
              <div className="card" key={item.id} style={{ padding: 0, overflow: 'hidden', transition: 'border-color .18s', display: 'flex', flexDirection: 'column' }} onMouseOver={(e) => ((e.currentTarget.style.borderColor = 'var(--b2)'))} onMouseOut={(e) => ((e.currentTarget.style.borderColor = 'var(--b1)'))}>
                <div style={{ height: 120, background: 'linear-gradient(135deg,var(--s3),var(--s4))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 52, flexShrink: 0 }}>
                  {item.emoji}
                  {isOut && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="chip chip-red" style={{ fontSize: 12 }}>SOLD OUT</span>
                    </div>
                  )}
                  {isHidden && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="chip chip-yellow" style={{ fontSize: 12 }}>HIDDEN</span>
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 5 }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', background: 'rgba(0,0,0,.6)', borderColor: 'transparent', backdropFilter: 'blur(4px)' }} onClick={() => onEdit(item.id)} title="Edit">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z" /></svg>
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', background: 'rgba(0,0,0,.6)', borderColor: 'transparent', backdropFilter: 'blur(4px)' }} onClick={() => onDelete(item.id)} title="Delete">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--re)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    </button>
                  </div>
                </div>

                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, flex: 1 }}>{item.name}</div>
                    <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 15, color: 'var(--or)', flexShrink: 0 }}>₦{item.price.toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.desc}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
                    {item.tags.map((t) => (
                      <span key={t} style={{ fontSize: 10, background: 'var(--s4)', color: 'var(--t2)', padding: '2px 7px', borderRadius: 999, fontWeight: 600 }}>{tagLabel[t] || t}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--b1)' }}>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>⏱ {item.prep} mins</span>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => onToggleAvail(item.id)}>
                      {isOut ? '✓ Mark Available' : isHidden ? '👁 Unhide' : '✕ Sold Out'}
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
