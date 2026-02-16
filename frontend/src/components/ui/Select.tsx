import React from 'react';
import styles from './Select.module.css';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
}

export const Select = ({ label, error, options, placeholder, className, ...props }: SelectProps) => {
    return (
        <div className={`${styles.container} ${className || ''}`}>
            {label && <label className={styles.label}>{label}</label>}
            <select className={`${styles.select} ${error ? styles.errorSelect : ''}`} {...props}>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};
