import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    value: number;
    max?: number;
    color?: 'accent' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md';
    label?: string;
}

export function ProgressBar({ value, max = 100, color = 'accent', size = 'sm', label }: ProgressBarProps) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div className={styles.wrapper}>
            {label && <div className={styles.label}>{label} <span>{Math.round(pct)}%</span></div>}
            <div className={`${styles.track} ${styles[size]}`}>
                <div className={`${styles.fill} ${styles[color]}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
