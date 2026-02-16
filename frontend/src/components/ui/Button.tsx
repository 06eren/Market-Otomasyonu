import React from 'react';
import styles from './Button.module.css';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    icon,
    className,
    disabled,
    ...props
}: ButtonProps) => {
    return (
        <button
            className={`${styles.btn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${className || ''}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {!isLoading && icon && <span className="mr-1">{icon}</span>}
            {children}
        </button>
    );
};
