import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Info } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'google_oauth_not_configured') {
      setOauthNotice(
        'Google Sign-In is not configured yet. To enable it, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the backend .env file.'
      );
    } else if (errorParam === 'google_auth_failed') {
      setError('Google authentication was cancelled or failed. Please try again or use your password.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login({ email: email.trim(), password });
      if (loggedUser?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
          }}>
            <LogIn size={22} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--slate-900)' }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Sign in to access your resumes, ATS analytics and matched jobs.
          </p>
        </div>

        {oauthNotice && (
          <div className="alert alert-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '1.25rem' }}>
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem' }}>{oauthNotice}</div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem' }}>{error}</div>
          </div>
        )}

        {/* Google Authentication Button */}
        <GoogleSignInButton label="Sign in with Google" />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '1.25rem 0',
          color: 'var(--slate-400)',
          fontSize: '0.8125rem',
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: '0.05em'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--slate-200)' }} />
          <span style={{ padding: '0 0.75rem' }}>Or continue with email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--slate-200)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--slate-100)',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--slate-600)',
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ fontWeight: '600' }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
