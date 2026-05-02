import { useEffect, useMemo, useState } from 'react';
import { compressImageFile } from '../../lib/image';
import { uploadProfilePhotoToCloudinary, updateVendorProfilePhoto, getVendorProfilePhoto, deleteVendorProfilePhoto, setupWalletPin, changeWalletPin, fetchWalletOverview } from '../../services/vendorPortal';

interface SecurityScreenProps {
  onShowToast: (msg: string) => void;
}

type PinMode = 'main' | 'setup' | 'change' | 'done' | 'profile';

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
  const [mode, setMode] = useState<PinMode>('main');
  const [pinPhase, setPinPhase] = useState(0);
  const [pins, setPins] = useState(['', '', '']);
  const [mismatch, setMismatch] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [savingPin, setSavingPin] = useState(false);

  // Check if wallet has PIN set
  useEffect(() => {
    checkPinStatus();
    loadProfilePhoto();
  }, []);

  const checkPinStatus = async () => {
    try {
      const wallet = await fetchWalletOverview();
      setHasPin(!!wallet?.pinSet);
    } catch (error) {
      console.error('Failed to check PIN status:', error);
      setHasPin(null);
    }
  };

  const loadProfilePhoto = async () => {
    try {
      const photoUrl = await getVendorProfilePhoto();
      setProfilePhoto(photoUrl || null);
    } catch (error) {
      console.error('Failed to load profile photo:', error);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onShowToast('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onShowToast('Image must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      const compressed = await compressImageFile(file, 0.85);
      const cloudinaryUrl = await uploadProfilePhotoToCloudinary(compressed, (progress) => {
        setUploadProgress(progress);
      });
      await updateVendorProfilePhoto(cloudinaryUrl);
      setProfilePhoto(cloudinaryUrl);
      onShowToast('Profile photo updated successfully!');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await deleteVendorProfilePhoto();
      setProfilePhoto(null);
      onShowToast('Profile photo removed');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Failed to remove photo');
    }
  };

  const resetPinFlow = () => {
    setPinPhase(0);
    setPins(['', '', '']);
    setMismatch(false);
  };

  const handlePinComplete = async () => {
    if (savingPin) return;
    
    setSavingPin(true);
    try {
      if (mode === 'setup') {
        // Setup: pins[0]=new, pins[1]=confirm
        if (pins[0] !== pins[1]) {
          setMismatch(true);
          setTimeout(() => {
            setPins(['', '']);
            setPinPhase(0);
            setMismatch(false);
          }, 600);
          return;
        }
        await setupWalletPin(pins[0]);
        setHasPin(true);
        onShowToast('PIN set successfully!');
      } else if (mode === 'change') {
        // Change: pins[0]=current, pins[1]=new, pins[2]=confirm
        if (pins[1] !== pins[2]) {
          setMismatch(true);
          setTimeout(() => {
            setPins([pins[0], '', '']);
            setPinPhase(1);
            setMismatch(false);
          }, 600);
          return;
        }
        await changeWalletPin(pins[0], pins[1]);
        onShowToast('PIN changed successfully!');
      }
      setMode('done');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Failed to save PIN');
      resetPinFlow();
    } finally {
      setSavingPin(false);
    }
  };

  const tapPin = (k: string) => {
    if (savingPin) return;
    
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

  // Auto-advance and handle completion
  useEffect(() => {
    const phaseValue = pins[pinPhase];
    if (phaseValue.length !== 4) return;

    if (mode === 'setup') {
      // Setup: 0=new, 1=confirm
      if (pinPhase === 0) {
        const t = setTimeout(() => {
          setPinPhase(1);
          setPins((p) => [p[0], '', '']);
        }, 220);
        return () => clearTimeout(t);
      }
      if (pinPhase === 1) {
        handlePinComplete();
      }
    } else if (mode === 'change') {
      // Change: 0=current, 1=new, 2=confirm
      if (pinPhase < 2) {
        const t = setTimeout(() => {
          setPinPhase((p) => p + 1);
          setPins((p) => {
            const next = [...p];
            next[pinPhase + 1] = '';
            return next;
          });
        }, 220);
        return () => clearTimeout(t);
      }
      if (pinPhase === 2) {
        handlePinComplete();
      }
    }
  }, [pinPhase, pins, mode]);

  return (
    <div id="screen-security" className="screen">
      <div className="fu">
        <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Security &amp; PIN</div>
        <div style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 20 }}>Protect your wallet from unauthorised withdrawals</div>

        {mode === 'main' && (
          <div id="sec-main" style={{ maxWidth: 480 }}>
            {hasPin === false && (
              <div style={{ padding: '14px 16px', borderRadius: 'var(--r2)', background: 'var(--yeg)', border: '1px solid rgba(245,158,11,.25)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ye)" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ye)' }}>PIN Required</div>
                    <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>Set up your PIN to enable withdrawals</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="sec-card" onClick={() => { setMode('profile'); }}>
              <div className="sec-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Profile Picture</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{profilePhoto ? 'Update your photo' : 'Add a profile photo'}</div></div>
              {profilePhoto && <div style={{ width: 32, height: 32, borderRadius: '50%', background: `url(${profilePhoto}) center/cover`, border: '2px solid var(--or)' }} />}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
            </div>
            
            {hasPin ? (
              <div className="sec-card" onClick={() => { setMode('change'); resetPinFlow(); }}>
                <div className="sec-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11a7 7 0 0114 0v1h1a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1v-8a1 1 0 011-1h1v-1zm7 5v2" /></svg></div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Change Wallet PIN</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Update your 4-digit withdrawal PIN</div></div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
              </div>
            ) : (
              <div className="sec-card" onClick={() => { setMode('setup'); resetPinFlow(); }} style={{ border: '2px solid var(--or)' }}>
                <div className="sec-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--or)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11a7 7 0 0114 0v1h1a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1v-8a1 1 0 011-1h1v-1zm7 5v2" /></svg></div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>Set Up Wallet PIN</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Create your 4-digit withdrawal PIN</div></div>
                <span className="chip chip-orange">Required</span>
              </div>
            )}
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

        {(mode === 'change' || mode === 'setup') && (
          <div id="sec-change" style={{ maxWidth: 360 }}>
            <div className="card fu">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setMode('main')}>← Back</button>
                <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 16 }}>
                  {mode === 'setup' ? 'Set Up PIN' : 'Change PIN'}
                </div>
              </div>
              
              {savingPin && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid var(--or)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 8 }}>Saving...</p>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 6, marginBottom: 22 }} id="pin-steps">
                {(mode === 'setup' ? [0, 1] : [0, 1, 2]).map((i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div id={`step-bar-${i}`} className="step-bar" style={{ background: i <= pinPhase ? 'var(--or)' : 'var(--s4)' }}></div>
                    <div id={`step-lbl-${i}`} style={{ fontSize: 10, color: i === pinPhase ? 'var(--or)' : 'var(--t3)', fontWeight: 600, marginTop: 5 }}>
                      {mode === 'setup' 
                        ? (i === 0 ? 'New' : 'Confirm')
                        : (i === 0 ? 'Current' : i === 1 ? 'New' : 'Confirm')
                      }
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t2)', marginBottom: 4 }} id="pin-prompt">
                {mode === 'setup'
                  ? (pinPhase === 0 ? 'Enter new 4-digit PIN' : 'Confirm new PIN')
                  : (pinPhase === 0 ? 'Enter current PIN' : pinPhase === 1 ? 'Enter new PIN' : 'Confirm new PIN')
                }
              </div>
              
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
              <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
                {hasPin ? 'PIN Updated!' : 'PIN Set Up!'}
              </div>
              <div style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 22 }}>
                {hasPin 
                  ? 'Your wallet PIN has been changed successfully.'
                  : 'Your wallet PIN has been set up. You can now make withdrawals!'
                }
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMode('main')}>Done</button>
            </div>
          </div>
        )}

        {mode === 'profile' && (
          <div id="sec-profile" style={{ maxWidth: 400 }}>
            <div className="card fu">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setMode('main')}>← Back</button>
                <div style={{ fontFamily: 'var(--hd)', fontWeight: 700, fontSize: 16 }}>Profile Picture</div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: profilePhoto ? `url(${profilePhoto}) center/cover` : 'var(--s3)', border: '3px solid var(--or)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', overflow: 'hidden' }}>
                  {!profilePhoto && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--t2)' }}>{profilePhoto ? 'Your current profile photo' : 'No profile photo set'}</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <input
                  type="file"
                  id="profile-photo-input"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }}
                />
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => document.getElementById('profile-photo-input')?.click()}
                  disabled={uploading}
                >
                  {uploading ? `Uploading... ${uploadProgress}%` : profilePhoto ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>

              {profilePhoto && (
                <button
                  className="btn btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                >
                  Remove Photo
                </button>
              )}

              <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 'var(--r2)', background: 'var(--s2)', fontSize: 12, color: 'var(--t3)' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Tips:</div>
                • Use a clear, well-lit photo<br />
                • JPG, PNG formats (max 5MB)<br />
                • Photo will be automatically resized
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
