import { useEffect, useState } from 'react';
import type { FoodItem } from '../../data/mock';

interface AddFoodModalProps {
  open: boolean;
  editingItem: FoodItem | null;
  onClose: () => void;
  onSave: (item: Omit<FoodItem, 'id' | 'emoji'> & { id?: string; emoji?: string }) => void;
}

const TAGS = [
  { key: 'spicy', label: '🌶 Spicy' },
  { key: 'popular', label: '⭐ Popular' },
  { key: 'new', label: '✨ New' },
  { key: 'vegan', label: '🌿 Vegan' },
  { key: 'bestseller', label: '🔥 Best Seller' },
];

const EMOJIS: Record<string, string> = { rice: '🍛', soup: '🥣', protein: '🍗', drinks: '🥤' };

export function AddFoodModal({ open, editingItem, onClose, onSave }: AddFoodModalProps) {
  const [name, setName] = useState('');
  const [cat, setCat] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [prep, setPrep] = useState('');
  const [avail, setAvail] = useState<'available' | 'soldout' | 'hidden'>('available');
  const [tags, setTags] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setName(editingItem.name);
      setCat(editingItem.cat);
      setPrice(String(editingItem.price));
      setDesc(editingItem.desc);
      setPrep(String(editingItem.prep));
      setAvail(editingItem.avail);
      setTags([...editingItem.tags]);
      setPreviewUrl(editingItem.image || null);
      setImageData(editingItem.image || null);
    } else {
      setName('');
      setCat('');
      setPrice('');
      setDesc('');
      setPrep('');
      setAvail('available');
      setTags([]);
      setErr('');
      setPreviewUrl(null);
      setImageData(null);
    }
  }, [open, editingItem]);

  const toggleTag = (tag: string) => {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  };

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = String(e.target?.result || '');
      setPreviewUrl(result);
      setImageData(result);
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!name.trim()) { setErr('Food name is required'); return; }
    if (!cat) { setErr('Please select a category'); return; }
    const p = Number(price);
    if (!p || p < 1) { setErr('Enter a valid price'); return; }
    setErr('');
    onSave({
      id: editingItem?.id,
      name: name.trim(),
      cat: cat as FoodItem['cat'],
      price: p,
      desc: desc.trim(),
      prep: Number(prep) || 15,
      avail,
      tags,
      emoji: EMOJIS[cat] || '🍽',
      image: imageData || editingItem?.image || '',
    });
  };

  return (
    <div className={`overlay ${open ? 'open' : ''}`} id="add-food-modal" onClick={(e) => { if ((e.target as HTMLElement).id === 'add-food-modal') onClose(); }}>
      <div className="modal" style={{ maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 19 }}>{editingItem ? 'Edit Food Item' : 'Add Food Item'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div
          id="food-img-preview"
          onClick={() => document.getElementById('food-img-input')?.click()}
          style={{ border: '2px dashed var(--b2)', borderRadius: 'var(--r1)', height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 18, transition: 'border-color .17s', background: 'var(--s3)', position: 'relative', overflow: 'hidden', backgroundImage: previewUrl ? `url(${previewUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
          onMouseOver={(e) => ((e.currentTarget.style.borderColor = 'var(--or)'))}
          onMouseOut={(e) => ((e.currentTarget.style.borderColor = 'var(--b2)'))}
        >
          {!previewUrl && (
            <>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
              <div style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>Click to upload food photo</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>PNG, JPG up to 5MB</div>
            </>
          )}
          {previewUrl && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,.5)', padding: '4px 12px', borderRadius: 99 }}>Change Photo</span>
            </div>
          )}
          <input type="file" id="food-img-input" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0])} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div style={{ gridColumn: '1/-1' }}><label className="lbl">Food Name *</label><input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jollof Rice with Chicken" /></div>
          <div>
            <label className="lbl">Category *</label>
            <select className="inp" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Select category</option>
              <option value="rice">Rice &amp; Swallow</option>
              <option value="protein">Proteins</option>
              <option value="soup">Soups</option>
              <option value="drinks">Drinks</option>
            </select>
          </div>
          <div><label className="lbl">Price (₦) *</label><input className="inp" value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="e.g. 2500" min={0} /></div>
          <div style={{ gridColumn: '1/-1' }}><label className="lbl">Description</label><textarea className="inp" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe this dish — ingredients, spice level, portion size…" rows={3} style={{ resize: 'vertical' }} /></div>
          <div>
            <label className="lbl">Prep Time (mins)</label>
            <input className="inp" value={prep} onChange={(e) => setPrep(e.target.value)} type="number" placeholder="e.g. 20" min={1} />
          </div>
          <div>
            <label className="lbl">Availability</label>
            <select className="inp" value={avail} onChange={(e) => setAvail(e.target.value as typeof avail)}>
              <option value="available">Available</option>
              <option value="soldout">Sold Out</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="lbl">Tags (optional)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {TAGS.map((t) => (
              <button
                type="button"
                key={t.key}
                className={`btn btn-sm ${tags.includes(t.key) ? 'btn-primary' : 'btn-ghost'} food-tag`}
                onClick={() => toggleTag(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {err && <div id="food-form-err" style={{ color: 'var(--re)', fontSize: 12.5, marginBottom: 10 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={submit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            <span>{editingItem ? 'Save Changes' : 'Save Food Item'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
