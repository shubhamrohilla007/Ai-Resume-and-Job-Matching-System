import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/client';
import { PasswordInput } from '../components/PasswordInput';
import { Lock, AlertCircle, CheckCircle2, ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'invalid' | 'missing'>('valid');
  const [tokenErrorMsg, setTokenErrorMsg] = useState<string>('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Compute password validation flags
  const isLengthValid = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  // On page load, verify token with backend
  useEffect(() => {
    if (!token.trim()) {
      setTokenStatus('missing');
      setTokenErrorMsg('A security token is required to reset your password. Please use the link sent to your email.');
      setVerifying(false);
      return;
    }

    const checkToken = async () => {
      setVerifying(true);
      try {
        const res = await authApi.verifyResetToken(token.trim());
        if (res.success && res.valid) {
          setTokenStatus('valid');
        } else {
          setTokenStatus('invalid');
          setTokenErrorMsg(res.message || 'This password reset link is invalid, expired, or has already been used.');
        }
      } catch (err: any) {
        setTokenStatus('invalid');
        setTokenErrorMsg(
          err?.response?.data?.message ||
          'This password reset link is invalid, expired, or has already been used.'
        );
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token.trim()) {
      setError('Missing security token. Please request a new password reset email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword({
        token: token.trim(),
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setSuccess(res.message || 'Your password has been reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to reset password. Please check your reset link or request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <Lock size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--slate-900)' }}>
            Set New Password
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Choose a strong, unique password to secure your account.
          </p>
        </div>

        {verifying ? (
          /* Loading / Verifying token */
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div className="spinner spinner-primary" style={{ width: '32px', height: '32px', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem' }}>
              Verifying security token...
            </p>
          </div>
        ) : tokenStatus !== 'valid' ? (
          /* Invalid or Missing Token Error State */
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div
              className="alert alert-danger"
              role="alert"
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                textAlign: 'left',
                marginBottom: '1.5rem',
              }}
            >
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                  {tokenStatus === 'missing' ? 'Missing Security Token' : 'Invalid or Expired Link'}
                </strong>
                {tokenErrorMsg}
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: '1.5rem' }}>
              Password reset links are valid for only 15 minutes and can only be used once for your security.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%' }}>
                Request New Reset Link
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : success ? (
          /* Success State */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div className="alert alert-success" role="alert" style={{ marginBottom: '1.5rem' }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>{success}</div>
            </div>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Proceed to Sign In
            </Link>
          </div>
        ) : (
          /* Valid Token: Password Input Form */
          <>
            {error && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* New Password with Independent Show/Hide Toggle */}
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">
                  New Password
                </label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  autoFocus
                />
                <div
                  className="form-hint"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>Must be at least 6 characters.</span>
                  {newPassword.length > 0 && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color:
                          newPassword.length >= 8
                            ? 'var(--success, #16a34a)'
                            : newPassword.length >= 6
                            ? 'var(--warning, #d97706)'
                            : 'var(--danger, #dc2626)',
                      }}
                    >
                      {newPassword.length >= 8 ? 'Strong' : newPassword.length >= 6 ? 'Fair' : 'Too short'}
                    </span>
                  )}
                </div>
              </div>

              {/* Confirm New Password with Independent Show/Hide Toggle */}
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <div className="form-hint">
                  {isMatch && (
                    <span
                      style={{
                        color: 'var(--success, #16a34a)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <ShieldCheck size={14} /> Passwords match
                    </span>
                  )}
                  {isMismatch && (
                    <span style={{ color: 'var(--danger, #dc2626)', fontWeight: 500 }}>
                      Passwords do not match yet
                    </span>
                  )}
                  {!confirmPassword && 'Enter your password again to confirm.'}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={loading || !isLengthValid || newPassword !== confirmPassword}
              >
                {loading ? <span className="spinner" /> : 'Set New Password'}
              </button>
            </form>

            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--slate-100)',
                textAlign: 'center',
                fontSize: '0.875rem',
              }}
            >
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--slate-600)',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
