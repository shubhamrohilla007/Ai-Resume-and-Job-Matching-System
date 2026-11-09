import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
  onVisibilityChange?: (visible: boolean) => void;
  showToggle?: boolean;
}

/**
 * Accessible, reusable Password Input component with Show/Hide toggle.
 * - Prevents default on toggle button click to avoid form submission or loss of cursor focus.
 * - Supports keyboard navigation with full aria-label attributes.
 * - Preserves password value and caret state when toggling between 'password' and 'text'.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      id,
      className = '',
      wrapperClassName = '',
      wrapperStyle,
      onVisibilityChange,
      showToggle = true,
      disabled = false,
      placeholder = '••••••••',
      ...rest
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent form submission and keep input focus intact
      e.preventDefault();
      e.stopPropagation();

      const nextState = !showPassword;
      setShowPassword(nextState);
      if (onVisibilityChange) {
        onVisibilityChange(nextState);
      }
    };

    return (
      <div
        className={`password-input-wrapper ${wrapperClassName}`.trim()}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          ...wrapperStyle,
        }}
      >
        <input
          {...rest}
          ref={ref}
          id={id}
          type={showPassword ? 'text' : 'password'}
          disabled={disabled}
          placeholder={placeholder}
          className={`form-input ${className}`.trim()}
          style={{
            paddingRight: showToggle ? '2.75rem' : undefined,
            ...rest.style,
          }}
        />

        {showToggle && (
          <button
            type="button"
            className="password-toggle-btn"
            onClick={toggleVisibility}
            onMouseDown={(e) => {
              // Crucial: prevent blur on the input so cursor doesn't jump or clear
              e.preventDefault();
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-controls={id}
            aria-pressed={showPassword}
            disabled={disabled}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff size={18} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Eye size={18} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
