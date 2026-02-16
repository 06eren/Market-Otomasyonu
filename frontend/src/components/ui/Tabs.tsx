import React from 'react';
import styles from './Tabs.module.css';

interface Tab {
    key: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (key: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
    return (
        <div className={styles.tabs}>
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                    onClick={() => onChange(tab.key)}
                >
                    {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
                    {tab.label}
                    {tab.count !== undefined && <span className={styles.count}>{tab.count}</span>}
                </button>
            ))}
        </div>
    );
}
