"use client";

import React, { useEffect, useState } from 'react';
import styles from './PageTransition.module.css';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Small delay to ensure the initial state renders first
        const raf = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className={`${styles.page} ${mounted ? styles.visible : ''} ${className || ''}`}>
            {children}
        </div>
    );
}
