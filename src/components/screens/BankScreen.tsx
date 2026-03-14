import { useState } from 'react';

interface BankScreenProps {
  onShowToast: (msg: string) => void;
}

export function BankScreen({ onShowToast }: BankScreenProps) {
  const [editing, setEditing] = useState(false);
  const [acctInput, setAcctInput] = useState('');

  const acctName = acctInput.length === 10 ? 'ADEYEMI BLESSED OLUWOLE' : '';

  return (
    <div id="screen-bank" className="screen">
      <div className="fu">
        <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Bank Account</div>
        <div style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 20 }}>Your payout destination</div>

        {!editing && (
          <div id="bank-view" style={{ maxWidth: 500 }}>
            <div style={{ background: 'linear-gradient(135deg,#1A2535,#0F1825)', border: '1px solid var(--b2)', borderRadius: 14, padding: '22px 22px 18px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,107,43,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -40, left: 20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, position: 'relative', zIndex: 1 }}>
                <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 14, color: 'var(--or)' }}>GTBank</div>
                <span className="chip chip-green"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gr)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg> Verified</span>
              </div>
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 600, fontSize: 18, letterSpacing: '.18em', color: 'var(--t1)', marginBottom: 16, position: 'relative', zIndex: 1 }}>**** **** **** 1234</div>
              <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500, position: 'relative', zIndex: 1 }}>ADEYEMI BLESSED OLUWOLE</div>
            </div>

            <div className="card" style={{ marginBottom: 14, padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--b1)', fontSize: 13 }}><span style={{ color: 'var(--t3)' }}>Account Name</span><span style={{ fontWeight: 600 }}>ADEYEMI BLESSED OLUWOLE</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--b1)', fontSize: 13 }}><span style={{ color: 'var(--t3)' }}>Bank</span><span style={{ fontWeight: 600 }}>GTBank</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--b1)', fontSize: 13 }}><span style={{ color: 'var(--t3)' }}>Account No.</span><span style={{ fontWeight: 600 }}>****1234</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: 13 }}><span style={{ color: 'var(--t3)' }}>Status</span><span className="chip chip-green">Verified</span></div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 'var(--r2)', background: 'var(--yeg)', border: '1px solid rgba(245,158,11,.18)', fontSize: 12.5, color: 'var(--ye)', marginBottom: 14 }}>
              ⚠ Only one bank account allowed (v1). Updating requires re-verification.
            </div>

            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setEditing(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z" /></svg>
              Update Bank Account
            </button>
          </div>
        )}

        {editing && (
          <div id="bank-edit" style={{ maxWidth: 500 }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 17 }}>Update Bank Account</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>✕</button>
              </div>
              <div style={{ marginBottom: 14 }}><label className="lbl">Bank Name</label><select className="inp"><option>GTBank</option><option>Access Bank</option><option>First Bank</option><option>Zenith Bank</option><option>UBA</option><option>Stanbic IBTC</option><option>Fidelity Bank</option></select></div>
              <div style={{ marginBottom: 14 }}><label className="lbl">Account Number</label><input className="inp" type="text" placeholder="10-digit account number" maxLength={10} value={acctInput} onChange={(e) => setAcctInput(e.target.value)} /></div>
              <div style={{ marginBottom: 20 }}>
                <label className="lbl">Account Name</label>
                <div
                  id="acct-name-field"
                  style={acctName ? { background: 'var(--grg)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 'var(--r2)', padding: '10px 13px', color: 'var(--gr)', fontWeight: 600, fontSize: 13.5 } : { background: 'var(--s3)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '10px 13px', color: 'var(--t3)', fontSize: 13 }}
                >
                  {acctName || 'Auto-filled after number entry…'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                  onClick={() => {
                    setEditing(false);
                    onShowToast('Bank account updated successfully!');
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                  Save &amp; Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
