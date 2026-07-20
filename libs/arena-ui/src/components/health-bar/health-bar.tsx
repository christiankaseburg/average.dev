import React from 'react';
import styles from './health-bar.module.scss';

export interface HealthBarProps {
  current: number;
  max: number;
  showText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function HealthBar({ current, max, showText = true, className, style }: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const isLow = percentage < 25;

  return (
    <div className={`${styles.healthBarContainer} ${className || ''}`} style={style}>
      <div 
        className={`${styles.fill} ${isLow ? styles.low : ''}`} 
        style={{ width: `${percentage}%` }} 
      />
      {showText && (
        <span className={styles.text}>
          {current} / {max}
        </span>
      )}
    </div>
  );
}
