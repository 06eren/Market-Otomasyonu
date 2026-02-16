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

/* ── New Variants ── */

export function SkeletonKPI({ count = 5 }: { count?: number }) {
    return (
        <div className={styles.kpiGrid}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={styles.kpiItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Skeleton width="40px" height="40px" borderRadius="var(--radius-md)" />
                        <div style={{ flex: 1 }}>
                            <Skeleton width="80px" height="10px" />
                            <Skeleton width="100px" height="22px" className={styles.mt} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <Skeleton width="160px" height="16px" />
                <Skeleton width="80px" height="12px" />
            </div>
            <div className={styles.chartBars}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={styles.chartCol}>
                        <Skeleton width="100%" height={`${20 + Math.random() * 60}%`} borderRadius="2px 2px 0 0" />
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} width="28px" height="10px" />
                ))}
            </div>
        </div>
    );
}

export function SkeletonForm() {
    return (
        <div className={styles.card}>
            <Skeleton width="120px" height="14px" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                    <Skeleton width="60px" height="10px" />
                    <Skeleton width="100%" height="36px" className={styles.mt} borderRadius="var(--radius-md)" />
                </div>
                <div>
                    <Skeleton width="80px" height="10px" />
                    <Skeleton width="100%" height="36px" className={styles.mt} borderRadius="var(--radius-md)" />
                </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
                <Skeleton width="70px" height="10px" />
                <Skeleton width="100%" height="36px" className={styles.mt} borderRadius="var(--radius-md)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.5rem' }}>
                <Skeleton width="80px" height="32px" borderRadius="var(--radius-md)" />
                <Skeleton width="100px" height="32px" borderRadius="var(--radius-md)" />
            </div>
        </div>
    );
}

export function SkeletonPage() {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <Skeleton width="200px" height="24px" />
                    <Skeleton width="280px" height="12px" className={styles.mt} />
                </div>
                <Skeleton width="120px" height="36px" borderRadius="var(--radius-md)" />
            </div>
            <SkeletonKPI count={4} />
            <div style={{ marginTop: '1.5rem' }}>
                <SkeletonChart />
            </div>
        </div>
    );
}
