import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        padding: showLabel ? '0.35rem 0.75rem' : '0.4rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--slate-200)',
        background: isDark ? 'var(--slate-800)' : 'var(--slate-100)',
        color: isDark ? '#fbbf24' : 'var(--slate-700)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '0.85rem',
        fontWeight: 600,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {isDark ? (
        <Sun size={17} style={{ color: '#fbbf24', transition: 'transform 0.3s ease' }} />
      ) : (
        <Moon size={17} style={{ color: 'var(--slate-600)', transition: 'transform 0.3s ease' }} />
      )}
      {showLabel && (
        <span style={{ color: 'var(--slate-700)' }}>
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
