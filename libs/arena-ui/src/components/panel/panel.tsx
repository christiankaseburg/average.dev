import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import styles from './panel.module.scss';

export interface PanelProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function Panel({ children, className, ...rest }: PanelProps) {
  return (
    <motion.div 
      className={`${styles.panel} ${className || ''}`}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
