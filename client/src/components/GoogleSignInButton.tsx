import React from 'react';

interface GoogleSignInButtonProps {
  label?: string;
  role?: 'job_seeker' | 'recruiter';
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  label = 'Continue with Google',
  role,
  disabled = false,
  style,
  className = '',
}) => {
  const handleGoogleClick = () => {
    if (disabled) return;
    const authUrl = `${API_BASE_URL}/auth/google${role ? `?role=${encodeURIComponent(role)}` : ''}`;
    window.location.href = authUrl;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={disabled}
      className={`btn-google ${className}`}
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        padding: '11px 16px',
        backgroundColor: '#ffffff',
        color: '#1e293b',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '0.9375rem',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        transition: 'all 0.15s ease-in-out',
        opacity: disabled ? 0.65 : 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#f8fafc';
          e.currentTarget.style.borderColor = '#94a3b8';
          e.currentTarget.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        }
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
          fill="#4285F4"
        />
        <path
          d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
          fill="#34A853"
        />
        <path
          d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1022-1.17.2822-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z"
          fill="#FBBC05"
        />
        <path
          d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.9245 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"
          fill="#EA4335"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
};
