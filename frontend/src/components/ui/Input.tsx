import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  hint,
  fullWidth = true,
  className = '',
  ...props
}: InputProps) {
  const inputStyles: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    padding: '9px 12px',
    fontSize: '15px',
    border: `1px solid ${error ? '#ef4444' : 'rgba(26, 26, 26, 0.12)'}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '5px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#1A1A1A',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </label>
      )}
      <input
        style={inputStyles}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : '#FF6B35';
          e.currentTarget.style.boxShadow = error ? '0 2px 6px rgba(239, 68, 68, 0.15)' : '0 2px 6px rgba(255, 107, 53, 0.15)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : 'rgba(26, 26, 26, 0.12)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
        }}
        {...props}
      />
      {error && (
        <p
          style={{
            marginTop: '4px',
            fontSize: '14px',
            color: '#ef4444',
          }}
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export function TextArea({
  label,
  error,
  hint,
  fullWidth = true,
  className = '',
  ...props
}: TextAreaProps) {
  const textareaStyles: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    padding: '9px 12px',
    fontSize: '15px',
    border: `1px solid ${error ? '#ef4444' : 'rgba(26, 26, 26, 0.12)'}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '90px',
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '5px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#1A1A1A',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </label>
      )}
      <textarea
        style={textareaStyles}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : '#FF6B35';
          e.currentTarget.style.boxShadow = error ? '0 2px 6px rgba(239, 68, 68, 0.15)' : '0 2px 6px rgba(255, 107, 53, 0.15)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : 'rgba(26, 26, 26, 0.12)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
        }}
        {...props}
      />
      {error && (
        <p
          style={{
            marginTop: '4px',
            fontSize: '14px',
            color: '#ef4444',
          }}
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
