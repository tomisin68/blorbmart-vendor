import type { Txn } from '../../data/mock';
import type { PageKey } from '../../types/ui';
import { fmtNaira } from '../../utils/format';

interface OverviewScreenProps {
  chart: { d: string; v: number }[];
  txns: Txn[];
  onOpenWithdraw: () => void;
  onNavigate: (page: PageKey) => void;
  onOpenTxDetail: (id: string) => void;
}

const txMeta = (t: Txn['type']) =>
  ({
    credit: { cls: 'chip-green', label: 'Credit' },
    debit: { cls: 'chip-red', label: 'Debit' },
    reversal: { cls: 'chip-yellow', label: 'Reversal' },
    adjustment: { cls: 'chip-blue', label: 'Adjustment' },
  }[t] || { cls: 'chip-orange', label: 'Other' });

export function OverviewScreen({ chart, txns, onOpenWithdraw, onNavigate, onOpenTxDetail }: OverviewScreenProps) {
  const max = Math.max(...chart.map((d) => d.v));

  return (
    <div id="screen-overview" className="screen active">
      <div className="bal-grid fu" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div className="bal-card hot fu fu1">
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Available Balance</div>
          <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', lineHeight: 1, color: '#fff', position: 'relative', zIndex: 1 }}>₦284,500</div>
        </div>
        <div className="bal-card fu fu2">
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Pending Balance</div>
          <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', lineHeight: 1 }}>₦41,200</div>
          <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 8 }}>Releases in ~24h</div>
        </div>
        <div className="bal-card fu fu3">
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Total Earned</div>
          <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', lineHeight: 1 }}>₦1,820,000</div>
          <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 8 }}>All time</div>
        </div>
      </div>

      <div className="fu fu4" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={onOpenWithdraw}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg>
          Withdraw Funds
        </button>
        <button className="btn btn-ghost" onClick={() => onNavigate('txns')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
          Transactions
        </button>
        <button className="btn btn-ghost" onClick={() => onNavigate('bank')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" /></svg>
          Manage Bank
        </button>
      </div>

      <div className="stats-chart-grid fu fu5" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 14, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Earnings Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '11px 13px' }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>This Week</div>
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 15 }}>₦84,200</div>
            </div>
            <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '11px 13px' }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>This Month</div>
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 15 }}>₦312,800</div>
            </div>
            <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '11px 13px' }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Orders (Mo.)</div>
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 15 }}>47</div>
            </div>
            <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '11px 13px' }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Avg Order</div>
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 15 }}>₦6,655</div>
            </div>
            <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '11px 13px', gridColumn: '1/-1' }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Busiest Day</div>
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 15 }}>Saturday</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 14 }}>Daily Earnings</div>
            <span className="chip chip-orange">Last 7 days</span>
          </div>
          <div id="chart" style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72 }}>
            {chart.map((d, i) => (
              <div className="bar-wrap" key={d.d}>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${(d.v / max) * 100}%`,
                      background: d.v === max ? 'linear-gradient(to top,var(--or),var(--or2))' : 'rgba(255,107,43,.28)',
                      animationDelay: `${i * 55}ms`,
                    }}
                  />
                </div>
                <span style={{ fontSize: 9.5, color: 'var(--t3)', fontWeight: 500 }}>{d.d}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--t3)' }}>
            <span>Peak: ₦31,200</span><span>Total: ₦115,100</span>
          </div>
        </div>
      </div>

      <div className="card fu fu6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 14 }}>Recent Activity</div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('txns')}>View all →</button>
        </div>
        <div>
          {txns.slice(0, 4).map((tx) => {
            const m = txMeta(tx.type);
            return (
              <div className="tx-row" key={tx.id} onClick={() => onOpenTxDetail(tx.id)}>
                <div className="tx-icon" style={{ background: tx.dir === 'in' ? 'var(--grg)' : 'var(--reg)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={tx.dir === 'in' ? 'var(--gr)' : 'var(--re)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {tx.dir === 'in' ? <path d="M12 5v14m0 0l7-7m-7 7l-7-7" /> : <path d="M12 19V5m0 0l-7 7m7-7l7 7" />}
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.desc}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{tx.time}</div>
                </div>
                <span className={`chip ${m.cls}`}>{m.label}</span>
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                  <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 13.5, color: tx.dir === 'in' ? 'var(--gr)' : 'var(--re)' }}>
                    {tx.dir === 'in' ? '+' : '−'}{fmtNaira(tx.amt)}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 1 }}>bal {fmtNaira(tx.bal)}</div>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
