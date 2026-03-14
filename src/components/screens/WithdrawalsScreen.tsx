interface WithdrawalsScreenProps {
  onOpenWithdraw: () => void;
}

export function WithdrawalsScreen({ onOpenWithdraw }: WithdrawalsScreenProps) {
  return (
    <div id="screen-withdrawals" className="screen">
      <div className="fu">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Withdrawals</div>
            <div style={{ color: 'var(--t3)', fontSize: 13 }}>History of all payout requests</div>
          </div>
          <button className="btn btn-primary" onClick={onOpenWithdraw}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg>
            New Withdrawal
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Total Withdrawn</div>
            <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 18 }}>₦130,000</div>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Processing</div>
            <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 18 }}>₦20,000</div>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Failed</div>
            <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 18, color: 'var(--re)' }}>₦30,000</div>
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderBottom: '1px solid var(--b1)' }}>
            <div className="tx-icon" style={{ background: 'var(--grg)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gr)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--hd)' }}>₦50,000</div><div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>GTBank ****1234 · Today, 11:10 AM</div><div style={{ fontSize: 11, color: 'var(--t3)' }}>Completed Today, 11:42 AM</div></div>
            <span className="chip chip-green">completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderBottom: '1px solid var(--b1)' }}>
            <div className="tx-icon" style={{ background: 'var(--grg)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gr)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--hd)' }}>₦80,000</div><div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>GTBank ****1234 · Jun 8, 2:00 PM</div><div style={{ fontSize: 11, color: 'var(--t3)' }}>Completed Jun 8, 2:31 PM</div></div>
            <span className="chip chip-green">completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderBottom: '1px solid var(--b1)' }}>
            <div className="tx-icon" style={{ background: 'var(--reg)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--re)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--hd)' }}>₦30,000</div><div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>GTBank ****1234 · Jun 3, 4:15 PM</div><div style={{ fontSize: 11, color: 'var(--re)' }}>Failed: Bank rejection</div></div>
            <span className="chip chip-red">failed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0' }}>
            <div className="tx-icon" style={{ background: 'var(--blg)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v5h5M20 20v-5h-5M20.5 9A9 9 0 005.2 5.2M3.5 15a9 9 0 0015.3 3.8" /></svg></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--hd)' }}>₦20,000</div><div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>GTBank ****1234 · Jun 1, 9:00 AM</div></div>
            <span className="chip chip-blue">processing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
