import React from 'react';
import styles from './text-input.module.scss';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function TextInput({
  label,
  error,
  icon,
  className,
  ...rest
}: TextInputProps) {
  return (
    <div className={`${styles.inputWrapper} ${className || ''}`}>
      {label && <label>{label}</label>}
      <div className={styles.inputContainer}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {/* Use a standard input to avoid Framer Motion onAnimationStart type conflicts */}
        <input
          className={icon ? styles.withIcon : ''}
          {...rest}
        />
      </div>
      {error && (
        <span className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
