import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, Briefcase, UserCheck, Info } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'job_seeker' | 'recruiter'>('job_seeker');
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
      setError('Google authentication was cancelled or failed. Please try again or create an account with email.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '3rem auto', padding: '0 1rem' }}>
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
            <UserPlus size={22} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--slate-900)' }}>
            Create Your Account
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            Choose your account role and get started in seconds.
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

        {/* Role Selection */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">I am joining as a:</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setRole('job_seeker')}
              className={`btn ${role === 'job_seeker' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.25rem' }}
            >
              <UserCheck size={18} />
              <span>Job Seeker / Student</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`btn ${role === 'recruiter' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem 0.5rem', gap: '0.25rem' }}
            >
              <Briefcase size={18} />
              <span>Employer / Recruiter</span>
            </button>
          </div>
        </div>

        {/* Google Authentication Button (carries selected role) */}
        <GoogleSignInButton label="Sign up with Google" role={role} />

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
          <span style={{ padding: '0 0.75rem' }}>Or register with email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--slate-200)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Sharma"
              required
            />
          </div>

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
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <div className="form-hint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Must contain at least 6 characters.</span>
              {password.length > 0 && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: password.length >= 8 ? 'var(--success, #16a34a)' : password.length >= 6 ? 'var(--warning, #d97706)' : 'var(--danger, #dc2626)',
                }}>
                  {password.length >= 8 ? 'Strong' : password.length >= 6 ? 'Fair' : `${6 - password.length} more`}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Create Account'}
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
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: '600' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
