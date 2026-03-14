import { useEffect, useMemo, useState } from 'react';

interface SecurityScreenProps {
  onShowToast: (msg: string) => void;
}

const pinPrompts = ['Enter your current PIN', 'Enter your new PIN', 'Confirm new PIN'];

function Keypad({ onTap }: { onTap: (key: string) => void }) {
  const keys = useMemo(() => [1,2,3,4,5,6,7,8,9,'',0,'⌫'], []);
  return (
    <div className="keypad" id="pin-keypad">
      {keys.map((k, i) => (
        <button key={`${k}-${i}`} className={`key-btn ${k === '' ? 'empty' : ''}`} onClick={() => onTap(String(k))}>{k}</button>
      ))}
    </div>
  );
}

export function SecurityScreen({ onShowToast }: SecurityScreenProps) {
  const [mode, setMode] = useState<'main' | 'change' | 'done'>('main');
  const [pinPhase, setPinPhase] = useState(0);
  const [pins, setPins] = useState(['', '', '']);
  const [mismatch, setMismatch] = useState(false);

  const tapPin = (k: string) => {
    if (k === '⌫') {
      setPins((p) => {
        const next = [...p];
        next[pinPhase] = next[pinPhase].slice(0, -1);
        return next;
      });
      return;
    }
    if (k === '') return;
    setPins((p) => {
      if (p[pinPhase].length >= 4) return p;
      const next = [...p];
      next[pinPhase] = next[pinPhase] + k;
      return next;
    });
  };

  useEffect(() => {
    const phaseValue = pins[pinPhase];
    if (phaseValue.length !== 4) return;

    if (pinPhase === 0) {
      const t = setTimeout(() => {
        setPinPhase(1);
        setPins((p) => [p[0], '', p[2]]);
      }, 220);
      return () => clearTimeout(t);
    }
    if (pinPhase === 1) {
      const t = setTimeout(() => {
        setPinPhase(2);
        setPins((p) => [p[0], p[1], '']);
      }, 220);
      return () => clearTimeout(t);
    }
    if (pinPhase === 2) {
      if (pins[2] === pins[1]) {
        const t = setTimeout(() => setMode('done'), 300);
        return () => clearTimeout(t);
      }
      setMismatch(true);
      const t = setTimeout(() => {
        setPins((p) => [p[0], p[1], '']);
        setMismatch(false);
      }, 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [pinPhase, pins]);

  return (
    <div id="screen-security" className="screen">
      <div className="fu">
        <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Security &amp; PIN</div>
        <div style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 20 }}>Protect your wallet from unauthorised withdrawals</div>

        {mode === 'main' && (
          <div id="sec-main" style={{ maxWidth: 480 }}>
            <div className="sec-card" onClick={() => { setMode('change'); setPinPhase(0); setPins(['', '', '']); }}>
              <div className="sec-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11a7 7 0 0114 0v1h1a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1v-8a1 1 0 011-1h1v-1zm7 5v2" /></svg></div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Change Wallet PIN</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Update your 4-digit withdrawal PIN</div></div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="sec-card" onClick={() => onShowToast('OTP sent to your registered phone number!')}>
              <div className="sec-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v5h5M20 20v-5h-5M20.5 9A9 9 0 005.2 5.2M3.5 15a9 9 0 0015.3 3.8" /></svg></div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Reset PIN via OTP</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Verify identity via SMS to reset PIN</div></div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="sec-card" style={{ cursor: 'default' }}>
              <div className="sec-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Withdrawal Lock</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>PIN required on every withdrawal</div></div>
              <span className="chip chip-green">Active</span>
            </div>
            <div className="sec-card" style={{ cursor: 'default' }}>
              <div className="sec-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3C7.7 6.2 6 8.4 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Security Alerts</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Notify on withdrawals and lock events</div></div>
              <span className="chip chip-green">On</span>
            </div>
            <div style={{ padding: '13px 16px', borderRadius: 'var(--r2)', background: 'var(--reg)', border: '1px solid rgba(244,63,94,.18)', fontSize: 12.5, color: 'var(--re)' }}>
              🔒 After 5 wrong PIN attempts, withdrawals lock for 24 hours.
            </div>
          </div>
        )}

        {mode === 'change' && (
          <div id="sec-change" style={{ maxWidth: 360 }}>
            <div className="card fu">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setMode('main')}>← Back</button>
                <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 16 }}>Change PIN</div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 22 }} id="pin-steps">
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div id={`step-bar-${i}`} className="step-bar" style={{ background: i <= pinPhase ? 'var(--or)' : 'var(--s4)' }}></div>
                    <div id={`step-lbl-${i}`} style={{ fontSize: 10, color: i === pinPhase ? 'var(--or)' : 'var(--t3)', fontWeight: 600, marginTop: 5 }}>{i === 0 ? 'Current' : i === 1 ? 'New' : 'Confirm'}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t2)', marginBottom: 4 }} id="pin-prompt">{pinPrompts[pinPhase]}</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '18px 0' }} id="pin-dots">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`pin-dot ${i < pins[pinPhase].length ? 'filled' : ''}`} id={`pd${i}`} />
                ))}
              </div>
              {mismatch && <div id="pin-mismatch" style={{ textAlign: 'center', color: 'var(--re)', fontSize: 12, marginBottom: 8 }}>PINs don&apos;t match — try again</div>}
              <Keypad onTap={tapPin} />
            </div>
          </div>
        )}

        {mode === 'done' && (
          <div id="sec-done" style={{ maxWidth: 360 }}>
            <div className="card fu" style={{ textAlign: 'center', padding: '40px 28px' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--grg)', border: '1px solid rgba(34,197,94,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', animation: 'glow 2s ease-in-out infinite' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gr)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>PIN Updated!</div>
              <div style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 22 }}>Your wallet PIN has been changed successfully.</div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMode('main')}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
