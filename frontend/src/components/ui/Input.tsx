import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = ({
    label,
    error,
    icon,
    className,
    ...props
}: InputProps) => {
    return (
        <div className={`${styles.container} ${className || ''}`}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={`${styles.inputWrapper} ${icon ? styles.hasIcon : ''}`}>
                {icon && <span className={styles.icon}>{icon}</span>}
                <input
                    className={`${styles.input} ${error ? styles.errorInput : ''}`}
                    {...props}
                />
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};
