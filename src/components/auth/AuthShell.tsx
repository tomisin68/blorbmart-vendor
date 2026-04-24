import { useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../../lib/firebase';
import {
  registerVendor,
  sendVendorEmailOtp,
  sendVendorResetEmail,
  signInVendor,
  signInVendorWithGoogle,
  submitVendorKyc,
  isVendorOtpVerified,
  verifyVendorEmailOtp,
} from '../../services/vendorAuth';

type AuthStep = 'login' | 'forgot' | 'register' | 'otp' | 'kyc' | 'pending';

interface AuthShellProps {
  hidden: boolean;
  onComplete: () => void;
  onShowToast: (msg: string) => void;
}

const featureBullets = [
  'Instant wallet credits after every delivery',
  'Withdraw to any Nigerian bank account',
  'Real-time order management dashboard',
  'Firebase-secured with end-to-end encryption',
];

const selfieTips = [
  'Good lighting — face a window or bright light',
  'Remove glasses if possible',
  'Plain background works best',
  'Look directly at the camera',
];

export function AuthShell({ hidden, onComplete, onShowToast }: AuthShellProps) {
  const [step, setStep] = useState<AuthStep>('login');
  const [kycStep, setKycStep] = useState(1);
  const [otpTimer, setOtpTimer] = useState(0);
  const [selfieCaptured, setSelfieCaptured] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [regData, setRegData] = useState({ fname: '', lname: '', kitchen: '', email: '', phone: '', pw: '' });
  const [regAgree, setRegAgree] = useState(false);
  const [regErr, setRegErr] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpErr, setOtpErr] = useState('');
  const otpRefs = useRef<HTMLInputElement[]>([]);

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [bizType, setBizType] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizState, setBizState] = useState('');
  const [bizLga, setBizLga] = useState('');
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState<'login' | 'google' | 'register' | 'forgot' | 'kyc' | 'otp' | null>(null);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    if (!hidden) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      html.style.overflow = '';
      body.style.overflow = '';
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [hidden]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || hidden) return;
    const email = user.email || '';
    if (!email) return;
    isVendorOtpVerified()
      .then((verified) => {
        if (!verified) {
          setRegData((d) => ({ ...d, email }));
          setStep('otp');
          setOtpTimer(60);
        }
      })
      .catch(() => undefined);
  }, [hidden]);

  const pwScore = useMemo(() => {
    const pw = regData.pw;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  }, [regData.pw]);

  const pwColors = ['var(--re)', 'var(--ye)', 'var(--or)', 'var(--gr)'];
  const pwLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const goAuthStep = (s: AuthStep) => setStep(s);

  const doLogin = async () => {
    if (!loginEmail || !loginPw) { setLoginErr('Please enter your email and password.'); return; }
    if (!loginEmail.includes('@')) { setLoginErr('Please enter a valid email address.'); return; }
    setLoginErr('');

    try {
      setLoading('login');
      await signInVendor(loginEmail, loginPw);
      onShowToast('Signed in successfully.');
      onComplete();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.';
      setLoginErr(message);
      if (message.toLowerCase().includes('otp')) {
        setRegData((d) => ({ ...d, email: loginEmail }));
        setStep('otp');
        setOtpTimer(60);
      }
    } finally {
      setLoading(null);
    }
  };

  const doGoogleLogin = async () => {
    setLoginErr('');
    try {
      setLoading('google');
      await signInVendorWithGoogle();
      onShowToast('Signed in with Google.');
      onComplete();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed.';
      setLoginErr(message);
      if (message.toLowerCase().includes('otp')) {
        const emailMatch = message.match(/[^\s]+@[^\s]+\.[^\s]+/);
        const email = emailMatch ? emailMatch[0] : regData.email;
        setRegData((d) => ({ ...d, email: email || d.email }));
        setStep('otp');
        setOtpTimer(60);
      }
    } finally {
      setLoading(null);
    }
  };

  const doForgot = async () => {
    if (!forgotEmail) return;

    try {
      setLoading('forgot');
      await sendVendorResetEmail(forgotEmail);
      onShowToast(`Reset link sent to ${forgotEmail}`);
      setTimeout(() => setStep('login'), 800);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to send reset email.');
    } finally {
      setLoading(null);
    }
  };

  const doRegister = async () => {
    const { fname, lname, kitchen, email, phone, pw } = regData;
    if (!fname || !lname) { setRegErr('Please enter your full name.'); return; }
    if (!kitchen) { setRegErr('Please enter your kitchen name.'); return; }
    if (!email.includes('@')) { setRegErr('Enter a valid email address.'); return; }
    if (!phone || phone.length < 10) { setRegErr('Enter a valid phone number.'); return; }
    if (pw.length < 8) { setRegErr('Password must be at least 8 characters.'); return; }
    if (!regAgree) { setRegErr('Please agree to the Terms of Service.'); return; }
    setRegErr('');

    try {
      setLoading('register');
      await registerVendor({
        firstName: fname,
        lastName: lname,
        businessName: kitchen,
        email,
        phone,
        password: pw,
      });
      await sendVendorEmailOtp(email);
      setStep('otp');
      setOtpTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
      onShowToast('Account created. Verification code sent to your email.');
    } catch (error) {
      setRegErr(error instanceof Error ? error.message : 'Unable to create your account.');
    } finally {
      setLoading(null);
    }
  };

  const doOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) { setOtpErr('Please enter the complete 6-digit code.'); return; }
    if (!regData.email.includes('@')) { setOtpErr('Missing registration email. Please register again.'); return; }
    setOtpErr('');
    try {
      setLoading('otp');
      await verifyVendorEmailOtp(regData.email, code);
      setStep('kyc');
      setKycStep(1);
      onShowToast('Email verified successfully.');
    } catch (error) {
      setOtpErr(error instanceof Error ? error.message : 'Invalid code.');
    } finally {
      setLoading(null);
    }
  };

  const resendOtp = async () => {
    if (!regData.email.includes('@')) {
      setOtpErr('Missing registration email.');
      return;
    }
    try {
      setLoading('otp');
      await sendVendorEmailOtp(regData.email);
      setOtpTimer(60);
      onShowToast('Verification code resent.');
    } catch (error) {
      setOtpErr(error instanceof Error ? error.message : 'Failed to resend code.');
    } finally {
      setLoading(null);
    }
  };

  const toggleCuisine = (v: string) => {
    setSelectedCuisines((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]));
  };

  const captureSelfie = () => {
    setSelfieCaptured(true);
  };

  const populateReview = () => {
    return {
      account: [
        ['Name', `${regData.fname || 'Funke'} ${regData.lname || 'Adeyemi'}`],
        ['Kitchen', regData.kitchen || "Funke's Kitchen"],
        ['Email', regData.email || 'funke@example.com'],
        ['Phone', `+234 ${regData.phone || '8012345678'}`],
      ],
      business: [
        ['Type', bizType || 'Home Kitchen'],
        ['Address', bizAddress || '12 Allen Ave, Ikeja, Lagos'],
        ['State', bizState || 'Lagos'],
        ['ID Type', idType || 'National ID Card (NIN)'],
        ['Cuisine', selectedCuisines.length ? selectedCuisines.join(', ') : 'Nigerian'],
      ],
    };
  };

  const review = populateReview();

  const doKycSubmit = async () => {
    if (!auth.currentUser) {
      onShowToast('Your session expired. Please sign in again.');
      setStep('login');
      return;
    }

    try {
      setLoading('kyc');
      await submitVendorKyc(auth.currentUser.uid, {
        businessType: bizType,
        address: bizAddress,
        state: bizState,
        lga: bizLga,
        idType,
        idNumber,
        cuisineTypes: selectedCuisines,
        selfieCaptured,
      });
      onShowToast('KYC details submitted for review.');
      setStep('pending');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to submit your KYC details.');
    } finally {
      setLoading(null);
    }
  };

  const authShellClass = hidden ? 'hidden' : '';

  return (
    <div id="auth-shell" className={authShellClass}>
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg,var(--or),#CC4010)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 18, color: '#fff', boxShadow: '0 4px 20px rgba(255,107,43,.45)' }}>B</div>
            <div>
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 16 }}>Blorbmart</div>
              <div style={{ fontSize: 11, color: 'var(--or)', fontWeight: 600, letterSpacing: '.05em' }}>KITCHEN PORTAL</div>
            </div>
          </div>

          <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 32, lineHeight: 1.2, marginBottom: 16 }}>
            Cook great food.<br />
            <span style={{ color: 'var(--or)' }}>Earn great money.</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.7, marginBottom: 40 }}>
            Join thousands of home kitchens and restaurants already earning on Blorbmart. Get paid directly to your wallet — no middlemen.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {featureBullets.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--org)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                </div>
                <span style={{ fontSize: 13, color: 'var(--t2)' }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40, padding: '16px 18px', background: 'rgba(255,255,255,.04)', borderRadius: 'var(--r2)', border: '1px solid var(--b1)' }}>
            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 10, fontStyle: 'italic' }}>"I went from 5 orders a day to over 30 within two months. The wallet feature makes payouts completely stress-free."</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--or),#CC4010)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 12, color: '#fff' }}>FA</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>Funke Adeyemi</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>Funke's Kitchen · Yaba, Lagos</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {step === 'login' && (
            <div className="auth-step active" id="step-login">
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 26, marginBottom: 6 }}>Welcome back</div>
                <div style={{ fontSize: 13.5, color: 'var(--t3)' }}>Sign in to your kitchen dashboard</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <button className="social-btn" onClick={doGoogleLogin} disabled={loading === 'google'}>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0112 4.9c1.76 0 3.35.65 4.57 1.7l3.4-3.4A11.95 11.95 0 0012 1C8.2 1 4.83 3 2.84 6.07l2.43 3.69z" /><path fill="#34A853" d="M16.04 18.01A7.08 7.08 0 0112 19.1c-2.84 0-5.27-1.67-6.48-4.1l-3.69 2.43A11.95 11.95 0 0012 23c3.24 0 6.18-1.22 8.4-3.22l-4.36-1.77z" /><path fill="#4A90D9" d="M20.4 19.78A11.95 11.95 0 0023 12c0-.78-.08-1.53-.22-2.27H12v4.54h6.19a5.4 5.4 0 01-2.15 3.27l4.36 1.77-.01.47z" /><path fill="#FBBC05" d="M5.52 15A7.08 7.08 0 014.9 12c0-1.05.18-2.07.5-3l-2.56-3.93A11.95 11.95 0 001 12c0 1.93.46 3.75 1.27 5.38L5.52 15z" /></svg>
                  {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--b1)' }}></div>
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>or sign in with email</span>
                <div style={{ flex: 1, height: 1, background: 'var(--b1)' }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 6 }}>
                <div>
                  <label className="lbl">Email Address</label>
                  <input className="inp" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="lbl">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="inp" type={showLoginPw ? 'text' : 'password'} value={loginPw} onChange={(e) => setLoginPw(e.target.value)} placeholder="Your password" style={{ paddingRight: 42 }} />
                    <button onClick={() => setShowLoginPw((s) => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 2 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <button onClick={() => goAuthStep('forgot')} style={{ background: 'none', border: 'none', color: 'var(--or)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--bd)' }}>Forgot password?</button>
              </div>

              {loginErr && <div id="login-err" style={{ color: 'var(--re)', fontSize: 12.5, marginBottom: 12, background: 'var(--reg)', padding: '10px 13px', borderRadius: 'var(--r2)' }}>{loginErr}</div>}

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13, fontSize: 14 }} onClick={doLogin} disabled={loading === 'login'}>
                {loading === 'login' ? 'Signing In...' : 'Sign In to Dashboard'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--t3)' }}>
                New kitchen? <button onClick={() => goAuthStep('register')} style={{ background: 'none', border: 'none', color: 'var(--or)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--bd)' }}>Create an account</button>
              </div>
            </div>
          )}

          {step === 'forgot' && (
            <div className="auth-step active" id="step-forgot">
              <button onClick={() => goAuthStep('login')} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--bd)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, padding: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m0 0l7 7m-7-7l7-7" /></svg>
                Back to sign in
              </button>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 24, marginBottom: 6 }}>Reset Password</div>
                <div style={{ fontSize: 13, color: 'var(--t3)' }}>We'll send a reset link to your email</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="lbl">Email Address</label>
                <input className="inp" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} onClick={doForgot} disabled={loading === 'forgot'}>{loading === 'forgot' ? 'Sending...' : 'Send Reset Link'}</button>
            </div>
          )}

          {step === 'register' && (
            <div className="auth-step active" id="step-register">
              <button onClick={() => goAuthStep('login')} style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--bd)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m0 0l7 7m-7-7l7-7" /></svg>
                Back to sign in
              </button>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 24, marginBottom: 4 }}>Create Account</div>
                <div style={{ fontSize: 13, color: 'var(--t3)' }}>Start your kitchen journey on Blorbmart</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="lbl">First Name</label>
                    <input className="inp" value={regData.fname} onChange={(e) => setRegData((d) => ({ ...d, fname: e.target.value }))} placeholder="Funke" />
                  </div>
                  <div>
                    <label className="lbl">Last Name</label>
                    <input className="inp" value={regData.lname} onChange={(e) => setRegData((d) => ({ ...d, lname: e.target.value }))} placeholder="Adeyemi" />
                  </div>
                </div>
                <div>
                  <label className="lbl">Kitchen / Business Name</label>
                  <input className="inp" value={regData.kitchen} onChange={(e) => setRegData((d) => ({ ...d, kitchen: e.target.value }))} placeholder="e.g. Funke's Kitchen" />
                </div>
                <div>
                  <label className="lbl">Email Address</label>
                  <input className="inp" type="email" value={regData.email} onChange={(e) => setRegData((d) => ({ ...d, email: e.target.value }))} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="lbl">Phone Number</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ background: 'var(--s3)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '10px 12px', fontSize: 13, color: 'var(--t2)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>🇳🇬 +234</div>
                    <input className="inp" value={regData.phone} onChange={(e) => setRegData((d) => ({ ...d, phone: e.target.value }))} type="tel" placeholder="8012345678" />
                  </div>
                </div>
                <div>
                  <label className="lbl">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="inp" type={showRegPw ? 'text' : 'password'} value={regData.pw} onChange={(e) => setRegData((d) => ({ ...d, pw: e.target.value }))} placeholder="Min. 8 characters" style={{ paddingRight: 42 }} />
                    <button onClick={() => setShowRegPw((s) => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 2 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 4 }} id="pw-bars">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="pw-strength-bar" style={{ flex: 1, height: 3, borderRadius: 2, background: i < pwScore ? pwColors[pwScore - 1] : 'var(--s4)' }} />
                    ))}
                  </div>
                  <div id="pw-strength-label" style={{ fontSize: 11, color: pwScore ? pwColors[pwScore - 1] : 'var(--t3)', marginTop: 4 }}>{regData.pw.length ? pwLabels[pwScore - 1] || '' : ''}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
                <input type="checkbox" checked={regAgree} onChange={(e) => setRegAgree(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--or)', flexShrink: 0 }} />
                <label style={{ fontSize: 12.5, color: 'var(--t3)', cursor: 'pointer', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400 }}>
                  I agree to Blorbmart's <span style={{ color: 'var(--or)' }}>Terms of Service</span> and <span style={{ color: 'var(--or)' }}>Privacy Policy</span>
                </label>
              </div>

              {regErr && <div id="reg-err" style={{ color: 'var(--re)', fontSize: 12.5, marginBottom: 12, background: 'var(--reg)', padding: '10px 13px', borderRadius: 'var(--r2)' }}>{regErr}</div>}

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13, fontSize: 14 }} onClick={doRegister} disabled={loading === 'register'}>
                {loading === 'register' ? 'Creating Account...' : 'Create Account &amp; Continue'}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="auth-step active" id="step-otp">
              <div style={{ marginBottom: 28, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--org)', border: '1px solid rgba(255,107,43,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
                </div>
                <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 22, marginBottom: 6 }}>Verify Your Number</div>
                <div style={{ fontSize: 13, color: 'var(--t3)' }}>We sent a 6-digit code to <span id="otp-phone-display" style={{ color: 'var(--t1)', fontWeight: 600 }}>{regData.email || 'your email'}</span></div>
              </div>

              <div className="otp-grid" style={{ marginBottom: 24 }}>
                {otpDigits.map((val, i) => (
                  <input
                    key={i}
                    className="otp-box"
                    maxLength={1}
                    value={val}
                    ref={(el) => { if (el) otpRefs.current[i] = el; }}
                    onChange={(e) => {
                      const v = e.target.value.slice(-1);
                      setOtpDigits((d) => {
                        const next = [...d];
                        next[i] = v;
                        return next;
                      });
                      if (v && i < 5) otpRefs.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
                        otpRefs.current[i - 1]?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              {otpErr && <div id="otp-err" style={{ color: 'var(--re)', fontSize: 12.5, marginBottom: 12, textAlign: 'center' }}>{otpErr}</div>}

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} onClick={doOtp} disabled={loading === 'otp'}>
                {loading === 'otp' ? 'Verifying...' : 'Verify Code'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: 'var(--t3)' }}>
                Didn't receive it? {otpTimer > 0 ? <span id="resend-timer"> in {otpTimer}s</span> : <button id="resend-btn" onClick={resendOtp} disabled={loading === 'otp'} style={{ background: 'none', border: 'none', color: 'var(--or)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--bd)' }}>Resend</button>}
              </div>
            </div>
          )}

          {step === 'kyc' && (
            <div className="auth-step active" id="step-kyc">
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 22 }}>Identity Verification</div>
                  <span id="kyc-step-label" style={{ fontSize: 12, color: 'var(--or)', fontWeight: 600, background: 'var(--org)', padding: '3px 10px', borderRadius: 999 }}>Step {kycStep} of 4</span>
                </div>
                <div className="kyc-progress-track">
                  <div className="kyc-progress-fill" id="kyc-prog" style={{ width: `${kycStep * 25}%` }}></div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }} id="kyc-prog-label">{kycStep === 1 ? 'Business Information' : kycStep === 2 ? 'Government ID' : kycStep === 3 ? 'Selfie Verification' : 'Review & Submit'}</div>
              </div>

              {kycStep === 1 && (
                <div className="auth-step active" id="kyc-1">
                  <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Business Information</div>
                  <div style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 20 }}>Tell us about your kitchen</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label className="lbl">Business Type</label>
                      <select className="inp" value={bizType} onChange={(e) => setBizType(e.target.value)}>
                        <option value="">Select type</option>
                        <option>Home Kitchen</option>
                        <option>Restaurant</option>
                        <option>Cloud Kitchen</option>
                        <option>Food Truck</option>
                        <option>Catering Business</option>
                      </select>
                    </div>
                    <div>
                      <label className="lbl">Kitchen Address</label>
                      <input className="inp" value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} placeholder="Full address including LGA and state" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="lbl">State</label>
                        <select className="inp" value={bizState} onChange={(e) => setBizState(e.target.value)}>
                          <option value="">State</option>
                          <option>Lagos</option><option>Abuja</option><option>Rivers</option>
                          <option>Oyo</option><option>Kano</option><option>Enugu</option>
                          <option>Delta</option><option>Anambra</option>
                        </select>
                      </div>
                      <div>
                        <label className="lbl">LGA</label>
                        <input className="inp" value={bizLga} onChange={(e) => setBizLga(e.target.value)} placeholder="e.g. Ikeja" />
                      </div>
                    </div>
                    <div>
                      <label className="lbl">Cuisine / Food Type</label>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 4 }} id="cuisine-tags">
                        {['Nigerian', 'Continental', 'Chinese', 'Grills', 'Pastries', 'Drinks & Juices'].map((c, i) => (
                          <button key={c} className={`btn btn-sm cuisine-tag ${selectedCuisines.includes(c) ? 'btn-primary' : 'btn-ghost'}`} data-v={c} onClick={() => toggleCuisine(c)}>
                            {i === 0 ? '🍛' : i === 1 ? '🍝' : i === 2 ? '🥡' : i === 3 ? '🍖' : i === 4 ? '🥐' : '🥤'} {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 24, padding: 13 }} onClick={() => setKycStep(2)}>Continue →</button>
                </div>
              )}

              {kycStep === 2 && (
                <div className="auth-step active" id="kyc-2">
                  <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Government ID</div>
                  <div style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 20 }}>We need a valid government-issued ID to verify your identity</div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="lbl">ID Type</label>
                    <select className="inp" value={idType} onChange={(e) => setIdType(e.target.value)}>
                      <option value="">Select ID type</option>
                      <option>National ID Card (NIN)</option>
                      <option>Driver's Licence</option>
                      <option>International Passport</option>
                      <option>Voter's Card (PVC)</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="lbl">ID Number</label>
                    <input className="inp" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Enter your ID number" />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label className="lbl">Front of ID</label>
                    <div className="upload-zone" id="id-front-zone" onClick={() => document.getElementById('id-front-input')?.click()}>
                      <input type="file" id="id-front-input" accept="image/*,application/pdf" />
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px', display: 'block' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                      <div id="id-front-name" style={{ fontSize: 13, color: 'var(--t2)' }}>Click to upload front of ID</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>JPG, PNG or PDF · Max 5MB</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label className="lbl">Back of ID <span style={{ color: 'var(--t3)', fontWeight: 400, textTransform: 'none' }}>(if applicable)</span></label>
                    <div className="upload-zone" id="id-back-zone" onClick={() => document.getElementById('id-back-input')?.click()}>
                      <input type="file" id="id-back-input" accept="image/*,application/pdf" />
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px', display: 'block' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                      <div id="id-back-name" style={{ fontSize: 13, color: 'var(--t2)' }}>Click to upload back of ID</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Optional for passport</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setKycStep(1)}>← Back</button>
                    <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: 13 }} onClick={() => setKycStep(3)}>Continue →</button>
                  </div>
                </div>
              )}

              {kycStep === 3 && (
                <div className="auth-step active" id="kyc-3">
                  <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Selfie Verification</div>
                  <div style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 20 }}>Take a clear photo of your face to match with your ID</div>

                  <div className={`selfie-frame ${selfieCaptured ? 'captured' : ''}`} id="selfie-frame" onClick={captureSelfie}>
                    <div id="selfie-inner">
                      {selfieCaptured ? (
                        <>
                          <div style={{ fontSize: 48 }}>😊</div>
                          <div style={{ fontSize: 12, color: 'var(--gr)', fontWeight: 600, marginTop: 8 }}>Selfie captured!</div>
                        </>
                      ) : (
                        <>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 8, textAlign: 'center' }}>Tap to take selfie</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ background: 'var(--s2)', borderRadius: 'var(--r2)', padding: '14px 16px', marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Tips for a good selfie:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {selfieTips.map((t) => (
                        <div key={t} style={{ fontSize: 12, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--or)', flexShrink: 0 }}></div>
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setKycStep(2)}>← Back</button>
                    <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: 13, opacity: selfieCaptured ? 1 : 0.5 }} disabled={!selfieCaptured} onClick={() => setKycStep(4)}>Continue →</button>
                  </div>
                </div>
              )}

              {kycStep === 4 && (
                <div className="auth-step active" id="kyc-4">
                  <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Review &amp; Submit</div>
                  <div style={{ fontSize: 12.5, color: 'var(--t3)', marginBottom: 20 }}>Please confirm everything looks correct before submitting</div>

                  <div className="card" style={{ marginBottom: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Account Details</div>
                    <div id="kyc-review-account" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                      {review.account.map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--t3)' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
                      ))}
                    </div>
                  </div>

                  <div className="card" style={{ marginBottom: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Business Info</div>
                    <div id="kyc-review-biz" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                      {review.business.map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--t3)' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
                      ))}
                    </div>
                  </div>

                  <div className="card" style={{ marginBottom: 20, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Documents</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--t3)' }}>Government ID</span><span className="chip chip-green"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gr)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg> Uploaded</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--t3)' }}>Selfie</span><span id="selfie-status" className={`chip ${selfieCaptured ? 'chip-green' : 'chip-yellow'}`}>{selfieCaptured ? 'Captured' : 'Pending'}</span></div>
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: 'var(--r2)', background: 'var(--blg)', border: '1px solid rgba(96,165,250,.2)', fontSize: 12.5, color: 'var(--bl)', marginBottom: 20 }}>
                    ℹ Verification usually takes 15–30 minutes. You'll get a push notification and email when approved.
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setKycStep(3)}>← Back</button>
                    <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: 13 }} onClick={doKycSubmit} disabled={loading === 'kyc'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                      {loading === 'kyc' ? 'Submitting...' : 'Submit for Review'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'pending' && (
            <div className="auth-step active" id="step-pending">
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--blg)', border: '1px solid rgba(96,165,250,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'glow 2s ease-in-out infinite' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
                </div>
                <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Verification Pending</div>
                <div style={{ fontSize: 13.5, color: 'var(--t3)', lineHeight: 1.7, marginBottom: 28 }}>
                  Your documents have been submitted. Our team is reviewing your application.<br />
                  <span style={{ color: 'var(--t1)', fontWeight: 500 }}>Expected time: 15–30 minutes</span>
                </div>

                <div style={{ textAlign: 'left', background: 'var(--s2)', borderRadius: 'var(--r1)', padding: 16, marginBottom: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[
                      ['done', 'Account Created', 'Email & phone verified'],
                      ['done', 'Documents Submitted', 'ID and selfie uploaded'],
                      ['curr', 'Under Review', 'Team reviewing your docs (~20 mins)'],
                      ['wait', 'Approval', "You'll be notified instantly"],
                    ].map(([s, t, d], i) => (
                      <div key={t} style={{ display: 'flex', gap: 12, paddingBottom: i < 3 ? 16 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, background: s === 'done' ? 'var(--gr)' : s === 'curr' ? 'var(--org)' : 'var(--s4)', color: s === 'done' ? '#fff' : s === 'curr' ? 'var(--or)' : 'var(--t3)', border: s === 'curr' ? '2px solid var(--or)' : '2px solid var(--b2)' }}>
                            {s === 'done' ? '✓' : i + 1}
                          </div>
                          {i < 3 && <div style={{ width: 2, flex: 1, background: s === 'done' ? 'var(--gr)' : 'var(--b1)', minHeight: 12, margin: '3px 0' }} />}
                        </div>
                        <div style={{ paddingTop: 2 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: s === 'curr' ? 'var(--or)' : undefined }}>{t}</div>
                          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} onClick={onComplete}>
                  Preview Dashboard →
                </button>
                <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 10 }}>Full access unlocks after approval</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
