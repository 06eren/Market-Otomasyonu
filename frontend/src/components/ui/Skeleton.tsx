import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', borderRadius = 'var(--radius-sm)', className }: SkeletonProps) {
    return <div className={`${styles.skeleton} ${className || ''}`} style={{ width, height, borderRadius }} />;
}

export function SkeletonRow() {
    return (
        <div className={styles.row}>
            <Skeleton width="60px" height="12px" />
            <Skeleton width="140px" height="12px" />
            <Skeleton width="80px" height="12px" />
            <Skeleton width="60px" height="12px" />
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <Skeleton width="100px" height="14px" />
                <Skeleton width="32px" height="32px" borderRadius="var(--radius-sm)" />
            </div>
            <Skeleton width="120px" height="28px" />
            <Skeleton width="80px" height="12px" className={styles.mt} />
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div style={{ padding: '0 1rem' }}>
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} />
            ))}
        </div>
    );
}
