import React from 'react';
import './Input.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
  label?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  size = 'md',
  error = false,
  helperText,
  label,
  icon,
  iconPosition = 'left',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClass = 'input-wrapper';
  const variantClass = `input-wrapper--${variant}`;
  const sizeClass = `input-wrapper--${size}`;
  const errorClass = error ? 'input-wrapper--error' : '';
  const iconClass = icon ? `input-wrapper--with-icon input-wrapper--icon-${iconPosition}` : '';

  const classes = [baseClass, variantClass, sizeClass, errorClass, iconClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {label && (
        <label htmlFor={inputId} className="input__label">
          {label}
        </label>
      )}
      <div className="input__container">
        {icon && iconPosition === 'left' && (
          <span className="input__icon input__icon--left">{icon}</span>
        )}
        <input id={inputId} className="input" {...props} />
        {icon && iconPosition === 'right' && (
          <span className="input__icon input__icon--right">{icon}</span>
        )}
      </div>
      {helperText && (
        <span className={`input__helper-text ${error ? 'input__helper-text--error' : ''}`}>
          {helperText}
        </span>
      )}
    </div>
  );
};

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
  label?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select: React.FC<SelectProps> = ({
  variant = 'default',
  size = 'md',
  error = false,
  helperText,
  label,
  options = [],
  className = '',
  id,
  children,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const baseClass = 'select-wrapper';
  const variantClass = `select-wrapper--${variant}`;
  const sizeClass = `select-wrapper--${size}`;
  const errorClass = error ? 'select-wrapper--error' : '';

  const classes = [baseClass, variantClass, sizeClass, errorClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {label && (
        <label htmlFor={selectId} className="select__label">
          {label}
        </label>
      )}
      <div className="select__container">
        <select id={selectId} className="select" {...props}>
          {children ||
            options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
        </select>
        <span className="select__chevron">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path
              d="M1 1L6 6L11 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {helperText && (
        <span className={`select__helper-text ${error ? 'select__helper-text--error' : ''}`}>
          {helperText}
        </span>
      )}
    </div>
  );
};

export default Input;
