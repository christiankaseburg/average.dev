import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import styles from './button.module.scss';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Button({ 
  variant = 'secondary', 
  children, 
  icon, 
  className,
  disabled,
  ...rest 
}: ButtonProps) {
  
  const classNames = [
    styles.button, 
    styles[variant],
    disabled ? styles.disabled : '',
    className || ''
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      className={classNames}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05, filter: 'brightness(1.2)' } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      {...rest}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </motion.button>
  );
}
