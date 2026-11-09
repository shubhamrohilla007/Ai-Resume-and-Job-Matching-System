import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/client';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedbackMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: cleanEmail });
      if (res.success) {
        setSubmitted(true);
        setFeedbackMsg(
          res.message || 'If an account exists for this email, password reset instructions will be sent.'
        );
      } else {
        setError(res.message || 'Unable to process reset request.');
      }
    } catch (err: any) {
      setError(
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Unable to process password reset request. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="card">
        {submitted ? (
          /* Secure Confirmation Screen (Does NOT redirect to reset password page) */
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#dbeafe',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Mail size={28} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--slate-900)' }}>
              Check Your Email
            </h1>

            <div
              className="alert alert-success"
              role="alert"
              style={{
                marginTop: '1.25rem',
                marginBottom: '1.25rem',
                textAlign: 'left',
                display: 'flex',
                gap: '0.65rem',
                alignItems: 'flex-start',
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                {feedbackMsg}
              </div>
            </div>

            <div
              style={{
                background: 'var(--slate-50)',
                border: '1px solid var(--slate-200)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                fontSize: '0.85rem',
                color: 'var(--slate-600)',
                lineHeight: 1.5,
                textAlign: 'left',
                marginBottom: '1.5rem',
              }}
            >
              <p style={{ margin: '0 0 0.5rem 0' }}>
                If you have an active account with <strong>{email}</strong>, a secure reset link was generated and dispatched.
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                <li>Click the reset link in the email to choose a new password.</li>
                <li>The security link will automatically expire in <strong>15 minutes</strong>.</li>
                <li>Check your spam or promotions folder if you don't see it within a minute.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                Return to Sign In
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                  setError(null);
                }}
                className="btn btn-secondary"
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={15} /> Try a Different Email
              </button>
            </div>
          </div>
        ) : (
          /* Request Email Form */
          <>
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
                <Mail size={24} />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--slate-900)' }}>
                Forgot Password
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                Enter your account email to receive a secure password reset link.
              </p>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Account Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Send Reset Link'}
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
