import React from 'react';
import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export const Card = ({ children, className, noPadding }: CardProps) => {
    return (
        <div className={`${styles.card} ${noPadding ? styles.noPadding : ''} ${className || ''}`}>
            {children}
        </div>
    );
};
