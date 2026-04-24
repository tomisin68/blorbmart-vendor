import { useState, useEffect } from 'react';
import { apiFetchAuth } from '../../lib/api';

interface KycScreenProps {
  onShowToast: (msg: string) => void;
}

interface KycStatus {
  status: 'not_started' | 'pending' | 'verified' | 'rejected' | 'expired';
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  diditSessionId?: string;
}

export function KycScreen({ onShowToast }: KycScreenProps) {
  const [kycStatus, setKycStatus] = useState<KycStatus>({ status: 'not_started' });
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    // Load KYC status from backend
    loadKycStatus();
  }, []);

  const loadKycStatus = async () => {
    try {
      const response = await apiFetchAuth('/api/vendor-kyc/status');
      
      if (response.ok) {
        const result = await response.json();
        setKycStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to load KYC status:', error);
    }
  };

  const startKycVerification = async () => {
    setLoading(true);
    try {
      const response = await apiFetchAuth('/api/vendor-kyc/init', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start verification');
      }
      
      const result = await response.json();
      const { sessionId, appId, verificationUrl, vendorEmail, vendorName, useApi } = result.data;
      
      if (useApi && verificationUrl) {
        // Use API approach - open verification URL
        window.open(verificationUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        setShowVerificationModal(true);
        onShowToast('KYC verification started! Complete the process in the new window.');
      } else {
        // Use SDK approach
        await loadDiditSDK();
        
        // Initialize Didit verification
        if (window.Didit) {
          window.Didit.init({
            appId: appId,
            sessionId: sessionId,
            userEmail: vendorEmail,
            userName: vendorName,
            onSuccess: () => {
              onShowToast('Verification completed successfully!');
              loadKycStatus();
            },
            onError: (error) => {
              onShowToast('Verification failed. Please try again.');
              console.error('Didit error:', error);
            },
            onClose: () => {
              setShowVerificationModal(false);
            }
          });
          
          setShowVerificationModal(true);
          onShowToast('KYC verification started! Please complete the process.');
        } else {
          throw new Error('Didit SDK failed to load');
        }
      }
      
      // Poll for status updates
      setTimeout(() => loadKycStatus(), 10000);
    } catch (error) {
      onShowToast('Failed to start KYC verification. Please try again.');
      console.error('KYC init error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDiditSDK = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.Didit) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.didit.me/sdk.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Didit SDK'));
      document.head.appendChild(script);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'var(--gr)';
      case 'pending': return 'var(--ye)';
      case 'rejected': return 'var(--re)';
      case 'expired': return 'var(--or)';
      default: return 'var(--t3)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>;
      case 'pending':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
      case 'rejected':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
      default:
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Under Review';
      case 'rejected': return 'Rejected';
      case 'expired': return 'Expired';
      default: return 'Not Started';
    }
  };

  return (
    <div id="screen-kyc" className="screen">
      <div className="fu">
        <div style={{ fontFamily: 'var(--hd)', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
          KYC Verification
        </div>
        <div style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 20 }}>
          Verify your identity to enable withdrawals and increase trust
        </div>

        {/* Status Card */}
        <div className="card" style={{ marginBottom: 20, maxWidth: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              background: `${getStatusColor(kycStatus.status)}20`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: getStatusColor(kycStatus.status)
            }}>
              {getStatusIcon(kycStatus.status)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                Verification Status: {getStatusText(kycStatus.status)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                {kycStatus.status === 'not_started' && 'Start verification to unlock all features'}
                {kycStatus.status === 'pending' && 'Your documents are being reviewed'}
                {kycStatus.status === 'verified' && 'Your identity has been verified'}
                {kycStatus.status === 'rejected' && 'Verification failed. Please try again.'}
                {kycStatus.status === 'expired' && 'Verification expired. Please re-verify.'}
              </div>
            </div>
          </div>

          {kycStatus.submittedAt && (
            <div style={{ fontSize: 11, color: 'var(--t3)', paddingTop: 12, borderTop: '1px solid var(--b1)' }}>
              Submitted: {new Date(kycStatus.submittedAt).toLocaleDateString()}
              {kycStatus.verifiedAt && ` • Verified: ${new Date(kycStatus.verifiedAt).toLocaleDateString()}`}
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="card" style={{ marginBottom: 20, maxWidth: 500 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Verification Requirements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              Valid government-issued ID
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" /></svg>
              Biometric face verification
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              Proof of address (utility bill)
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="card" style={{ marginBottom: 20, maxWidth: 500 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Benefits of Verification</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span className="chip chip-green" style={{ fontSize: 10, padding: '2px 6px' }}>✓</span>
              Unlimited withdrawal limits
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span className="chip chip-green" style={{ fontSize: 10, padding: '2px 6px' }}>✓</span>
              Verified vendor badge on your store
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span className="chip chip-green" style={{ fontSize: 10, padding: '2px 6px' }}>✓</span>
              Higher customer trust and orders
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span className="chip chip-green" style={{ fontSize: 10, padding: '2px 6px' }}>✓</span>
              Priority support
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(kycStatus.status === 'not_started' || kycStatus.status === 'rejected' || kycStatus.status === 'expired') && (
            <button
              className="btn btn-primary"
              onClick={startKycVerification}
              disabled={loading}
              style={{ justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: 8 }} />
                  Starting Verification...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  Start KYC Verification
                </>
              )}
            </button>
          )}

          {kycStatus.status === 'pending' && (
            <button
              className="btn btn-ghost"
              onClick={loadKycStatus}
              style={{ justifyContent: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Check Status
            </button>
          )}

          {kycStatus.status === 'verified' && (
            <div style={{ 
              padding: '16px', 
              borderRadius: 'var(--r2)', 
              background: 'var(--grg)', 
              border: '1px solid rgba(34,197,94,.2)', 
              textAlign: 'center',
              color: 'var(--gr)',
              fontSize: 13,
              fontWeight: 500
            }}>
              ✓ Your identity is verified and all features are unlocked
            </div>
          )}
        </div>

        {/* Help Section */}
        <div style={{ maxWidth: 500, marginTop: 24, padding: '16px', borderRadius: 'var(--r2)', background: 'var(--s3)', fontSize: 12, color: 'var(--t3)' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Need Help?</div>
          <div style={{ lineHeight: 1.5 }}>
            • Verification typically takes 5-10 minutes<br/>
            • Documents are encrypted and securely stored<br/>
            • Contact support if verification fails repeatedly<br/>
            • Verification expires after 1 year (re-verify required)
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: 400, margin: 20 }}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%', 
                background: 'var(--org)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px' 
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Verification Started!</div>
              <div style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 16, lineHeight: 1.4 }}>
                Complete the verification process in the new window that opened. 
                This page will automatically update when you're done.
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => setShowVerificationModal(false)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
