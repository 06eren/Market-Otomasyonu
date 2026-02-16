"use client";

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LoginPage from '@/app/login/page';
import styles from '@/app/layout.module.css';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { employee, isLoading, canAccess } = useAuth();
    const pathname = usePathname();

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-body)',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{
                    width: 40, height: 40,
                    border: '3px solid var(--border-subtle)',
                    borderTopColor: 'var(--accent-primary)',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Yükleniyor...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Not logged in → show login
    if (!employee) {
        return <LoginPage />;
    }

    // Logged in but no access to page
    if (!canAccess(pathname)) {
        return (
            <div className={styles.container}>
                <Sidebar />
                <div className={styles.contentWrapper}>
                    <Header />
                    <main className={styles.mainContent}>
                        <div style={{
                            textAlign: 'center',
                            padding: '4rem 1rem',
                            color: 'var(--text-secondary)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.15 }}>🔒</div>
                            <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Erişim Engellendi</h2>
                            <p style={{ fontSize: '0.875rem' }}>
                                Bu sayfaya erişim yetkiniz bulunmamaktadır.
                                Rolünüz: <strong>{employee.RoleName}</strong>
                            </p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // Normal authenticated layout
    return (
        <div className={styles.container}>
            <Sidebar />
            <div className={styles.contentWrapper}>
                <Header />
                <main className={styles.mainContent}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
    );
}
