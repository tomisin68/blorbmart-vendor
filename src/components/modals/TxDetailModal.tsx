import type { Txn } from '../../data/mock';
import { fmtNaira } from '../../utils/format';

interface TxDetailModalProps {
  open: boolean;
  tx: Txn | null;
  onClose: () => void;
}

const txMeta = (t: Txn['type']) =>
  ({
    credit: { cls: 'chip-green', label: 'Credit' },
    debit: { cls: 'chip-red', label: 'Debit' },
    reversal: { cls: 'chip-yellow', label: 'Reversal' },
    adjustment: { cls: 'chip-blue', label: 'Adjustment' },
  }[t] || { cls: 'chip-orange', label: 'Other' });

export function TxDetailModal({ open, tx, onClose }: TxDetailModalProps) {
  return (
    <div className={`overlay ${open ? 'open' : ''}`} id="tx-detail-modal" onClick={(e) => { if ((e.target as HTMLElement).id === 'tx-detail-modal') onClose(); }}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 18 }}>Transaction Detail</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {tx && (
          <>
            <div style={{ textAlign: 'center', padding: '10px 0 22px' }}>
              <div id="tx-modal-icon" style={{ width: 54, height: 54, borderRadius: 14, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tx.dir === 'in' ? 'var(--grg)' : 'var(--reg)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={tx.dir === 'in' ? 'var(--gr)' : 'var(--re)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {tx.dir === 'in' ? <path d="M12 5v14m0 0l7-7m-7 7l-7-7" /> : <path d="M12 19V5m0 0l-7 7m7-7l7 7" />}
                </svg>
              </div>
              <div id="tx-modal-amt" style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 28, marginBottom: 8, color: tx.dir === 'in' ? 'var(--gr)' : 'var(--re)' }}>
                {tx.dir === 'in' ? '+' : '−'}{fmtNaira(tx.amt)}
              </div>
              <span id="tx-modal-chip" className={`chip ${txMeta(tx.type).cls}`}>{txMeta(tx.type).label}</span>
            </div>
            <div id="tx-modal-rows">
              {[
                ['Description', tx.desc],
                ['Reference', tx.order || '—'],
                ['Balance After', fmtNaira(tx.bal)],
                ['Date & Time', tx.time],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderTop: '1px solid var(--b1)', fontSize: 13 }}>
                  <span style={{ color: 'var(--t3)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
