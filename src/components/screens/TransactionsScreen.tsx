import { useMemo, useState } from 'react';
import type { Txn } from '../../data/mock';
import { fmtNaira } from '../../utils/format';

interface TransactionsScreenProps {
  txns: Txn[];
  onOpenTxDetail: (id: string) => void;
}

const txMeta = (t: Txn['type']) =>
  ({
    credit: { cls: 'chip-green', label: 'Credit' },
    debit: { cls: 'chip-red', label: 'Debit' },
    reversal: { cls: 'chip-yellow', label: 'Reversal' },
    adjustment: { cls: 'chip-blue', label: 'Adjustment' },
  }[t] || { cls: 'chip-orange', label: 'Other' });

export function TransactionsScreen({ txns, onOpenTxDetail }: TransactionsScreenProps) {
  const [filter, setFilter] = useState<'all' | Txn['type']>('all');

  const list = useMemo(() => {
    return filter === 'all' ? txns : txns.filter((t) => t.type === filter);
  }, [txns, filter]);

  return (
    <div id="screen-txns" className="screen">
      <div className="fu">
        <div className="page-header">
          <div className="stack-sm">
            <div className="page-eyebrow">Wallet Ledger</div>
            <div className="page-title">Keep transaction history easy to scan.</div>
            <div className="page-subtitle">The ledger should feel trustworthy: clear amounts, clear labels, and one tap for detail when something needs a closer look.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
          {(['all', 'credit', 'debit', 'reversal', 'adjustment'] as const).map((f) => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'} tx-filter`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All Activity' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="card">
          <div>
            {list.length === 0 && (
              <div className="empty-state">No transactions found for this filter yet.</div>
            )}
            {list.map((tx) => {
              const m = txMeta(tx.type);
              return (
                <div className="tx-row" key={tx.id} onClick={() => onOpenTxDetail(tx.id)}>
                  <div className="tx-icon" style={{ background: tx.dir === 'in' ? 'var(--grg)' : 'var(--reg)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={tx.dir === 'in' ? 'var(--gr)' : 'var(--re)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {tx.dir === 'in' ? <path d="M12 5v14m0 0l7-7m-7 7l-7-7" /> : <path d="M12 19V5m0 0l-7 7m7-7l7 7" />}
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.desc}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--t2)', marginTop: 2 }}>{tx.time}</div>
                  </div>
                  <span className={`chip ${m.cls}`}>{m.label}</span>
                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
                    <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 14, color: tx.dir === 'in' ? 'var(--gr)' : 'var(--re)' }}>
                      {tx.dir === 'in' ? '+' : '-'}{fmtNaira(tx.amt)}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--t2)', marginTop: 1 }}>Balance {fmtNaira(tx.bal)}</div>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
