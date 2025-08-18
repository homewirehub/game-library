import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const fullWidthClass = fullWidth ? 'btn--full-width' : '';
  const loadingClass = loading ? 'btn--loading' : '';
  const disabledClass = disabled || loading ? 'btn--disabled' : '';

  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    loadingClass,
    disabledClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const renderIcon = () => {
    if (loading) {
      return <span className="btn__icon btn__icon--loading">🔄</span>;
    }
    if (icon) {
      return <span className={`btn__icon btn__icon--${iconPosition}`}>{icon}</span>;
    }
    return null;
  };

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {iconPosition === 'left' && renderIcon()}
      {children && <span className="btn__text">{children}</span>}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
};

export default Button;
