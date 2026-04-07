import type { WithdrawalRecord } from '../../types/portal';
import { fmtNaira } from '../../utils/format';

interface WithdrawalsScreenProps {
  onOpenWithdraw: () => void;
  withdrawals: WithdrawalRecord[];
}

export function WithdrawalsScreen({ onOpenWithdraw, withdrawals }: WithdrawalsScreenProps) {
  const totalWithdrawn = withdrawals.filter((item) => item.status === 'completed').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const processing = withdrawals.filter((item) => ['pending', 'processing'].includes(String(item.status))).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const failed = withdrawals.filter((item) => item.status === 'failed').reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div id="screen-withdrawals" className="screen">
      <div className="fu">
        <div className="page-header">
          <div className="stack-sm">
            <div className="page-eyebrow">Payout History</div>
            <div className="page-title">Make withdrawals feel transparent and reassuring.</div>
            <div className="page-subtitle">Vendors should always understand what has been paid out, what is processing, and what needs attention.</div>
          </div>
          <button className="btn btn-primary" onClick={onOpenWithdraw}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg>
            New Withdrawal
          </button>
        </div>
        <div className="quick-grid" style={{ marginBottom: 18 }}>
          <div className="metric-card">
            <div className="metric-label">Total Withdrawn</div>
            <div className="metric-value">{fmtNaira(totalWithdrawn)}</div>
            <div className="metric-note">Completed payouts sent to bank accounts.</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Processing</div>
            <div className="metric-value">{fmtNaira(processing)}</div>
            <div className="metric-note">Payouts still moving through settlement.</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Failed</div>
            <div className="metric-value" style={{ color: 'var(--re)' }}>{fmtNaira(failed)}</div>
            <div className="metric-note">Needs review or another payout attempt.</div>
          </div>
        </div>
        <div className="card">
          {withdrawals.length === 0 && (
            <div className="empty-state">No withdrawals yet. When a payout is requested, it will show up here.</div>
          )}
          {withdrawals.map((item, index) => {
            const status = String(item.status || 'pending').toLowerCase();
            const iconColor = status === 'completed' ? 'var(--gr)' : status === 'failed' ? 'var(--re)' : 'var(--bl)';
            const iconBg = status === 'completed' ? 'var(--grg)' : status === 'failed' ? 'var(--reg)' : 'var(--blg)';
            const chipClass = status === 'completed' ? 'chip-green' : status === 'failed' ? 'chip-red' : 'chip-blue';
            const iconPath = status === 'failed' ? 'M6 18L18 6M6 6l12 12' : status === 'completed' ? 'M5 13l4 4L19 7' : 'M4 4v5h5M20 20v-5h-5M20.5 9A9 9 0 005.2 5.2M3.5 15a9 9 0 0015.3 3.8';

            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderBottom: index < withdrawals.length - 1 ? '1px solid var(--b1)' : 'none' }}>
                <div className="tx-icon" style={{ background: iconBg }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={iconPath} /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--hd)' }}>{fmtNaira(Number(item.amount || 0))}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--t2)', marginTop: 2 }}>
                    {item.bankName || 'Bank'} {item.accountMasked || ''} · {item.initiatedAt ? new Date(item.initiatedAt).toLocaleString('en-NG') : 'Pending date'}
                  </div>
                  {status === 'failed' ? (
                    <div style={{ fontSize: 11, color: 'var(--re)', marginTop: 3 }}>Failed: {item.failureReason || 'Transfer failed'}</div>
                  ) : item.completedAt ? (
                    <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 3 }}>Completed {new Date(item.completedAt).toLocaleString('en-NG')}</div>
                  ) : null}
                </div>
                <span className={`chip ${chipClass}`}>{status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
