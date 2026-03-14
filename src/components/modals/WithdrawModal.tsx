import { useEffect, useMemo, useState } from 'react';
import { fmtNaira } from '../../utils/format';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  availableBalance?: number;
}

function Keypad({ onTap }: { onTap: (key: string) => void }) {
  const keys = useMemo(() => [1,2,3,4,5,6,7,8,9,'',0,'⌫'], []);
  return (
    <div className="keypad" id="wd-keypad">
      {keys.map((k, i) => (
        <button key={`${k}-${i}`} className={`key-btn ${k === '' ? 'empty' : ''}`} onClick={() => onTap(String(k))}>{k}</button>
      ))}
    </div>
  );
}

export function WithdrawModal({ open, onClose, onShowToast, availableBalance = 284500 }: WithdrawModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState('');
  const [err1, setErr1] = useState('');
  const [pin, setPin] = useState('');
  const [err2, setErr2] = useState('');

  useEffect(() => {
    if (!open) {
      setStep(1);
      setAmount('');
      setErr1('');
      setPin('');
      setErr2('');
    }
  }, [open]);

  const handleNext = () => {
    const amt = Number(amount);
    if (!amt || amt < 1000) {
      setErr1('Minimum withdrawal is ₦1,000');
      return;
    }
    if (amt > availableBalance) {
      setErr1('Insufficient available balance');
      return;
    }
    setErr1('');
    setStep(2);
  };

  const handleConfirm = () => {
    if (pin.length < 4) {
      setErr2('Enter your 4-digit PIN');
      return;
    }
    setErr2('');
    setStep(3);
    setTimeout(() => {
      onClose();
      onShowToast('Withdrawal is processing via Paystack!');
    }, 2400);
  };

  const tapPin = (k: string) => {
    if (k === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (k === '' || pin.length >= 4) return;
    setPin((p) => p + k);
  };

  return (
    <div className={`overlay ${open ? 'open' : ''}`} id="withdraw-modal" onClick={(e) => { if ((e.target as HTMLElement).id === 'withdraw-modal') onClose(); }}>
      <div className="modal">
        {step === 1 && (
          <div id="wd-step1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 19 }}>Withdraw Funds</div>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
            </div>
            <div style={{ background: 'var(--org)', border: '1px solid rgba(255,107,43,.2)', borderRadius: 'var(--r2)', padding: '13px 16px', marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: 'var(--or)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Available Balance</div>
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 22 }}>{fmtNaira(availableBalance)}</div>
            </div>
            <div style={{ marginBottom: 14 }}><label className="lbl">Amount (₦)</label><input className="inp" type="number" placeholder="e.g. 10000" value={amount} onChange={(e) => setAmount(e.target.value)} min={1000} /></div>
            <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
              {[5000, 10000, 20000, 50000].map((v) => (
                <button key={v} className="btn btn-ghost btn-sm" onClick={() => setAmount(String(v))}>₦{v.toLocaleString()}</button>
              ))}
            </div>
            {err1 && <div id="wd-err1" style={{ color: 'var(--re)', fontSize: 12.5, marginBottom: 10 }}>{err1}</div>}
            <div style={{ display: 'flex', gap: 9 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleNext}>Continue →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div id="wd-step2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 19 }}>Confirm PIN</div>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
            </div>
            <div style={{ background: 'var(--s3)', borderRadius: 'var(--r2)', padding: '12px 14px', marginBottom: 20, fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>ADEYEMI BLESSED OLUWOLE</div>
              <div style={{ color: 'var(--t3)' }}>GTBank · ****1234</div>
              <div style={{ marginTop: 8, fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 16, color: 'var(--or)' }} id="wd-confirm-amt">{fmtNaira(Number(amount) || 0)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 4 }}>Enter your 4-digit wallet PIN</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '16px 0' }}>
                {[0,1,2,3].map((i) => (
                  <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} id={`wd-pd${i}`} />
                ))}
              </div>
            </div>
            <Keypad onTap={tapPin} />
            {err2 && <div id="wd-err2" style={{ color: 'var(--re)', fontSize: 12.5, marginTop: 8, textAlign: 'center' }}>{err2}</div>}
            <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleConfirm}>Confirm Withdrawal</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div id="wd-step3" style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', border: '3px solid var(--or)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite', margin: '0 auto 18px' }} />
            <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Processing…</div>
            <div style={{ color: 'var(--t3)', fontSize: 13 }}>Your withdrawal is being sent via Paystack</div>
          </div>
        )}
      </div>
    </div>
  );
}
