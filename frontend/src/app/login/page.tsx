"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import styles from './login.module.css';
import { Lock, User, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const usernameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        usernameRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('Kullanıcı adı ve şifre zorunludur.');
            return;
        }
        setLoading(true);
        setError('');
        const result = await login(username.trim().toLowerCase(), password);
        if (!result.success) {
            setError(result.message || 'Giriş başarısız!');
            setLoading(false);
        }
        // on success, AuthProvider will update employee → layout will redirect
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit(e);
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.logoSection}>
                    <img src="/favicon.png" alt="InnoApp" className={styles.logo} style={{ borderRadius: 10, objectFit: 'contain' }} />
                    <h1 className={styles.brand}>Inno<span>App</span></h1>
                    <p className={styles.tagline}>Market Otomayonu</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            <User size={14} /> Kullanıcı Adı
                        </label>
                        <input
                            ref={usernameRef}
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Kullanıcı adınızı girin"
                            className={styles.input}
                            autoComplete="off"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            <Lock size={14} /> Şifre
                        </label>
                        <div className={styles.passwordWrap}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Şifrenizi girin"
                                className={styles.input}
                                autoComplete="off"
                            />
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className={styles.error}>
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? (
                            <span className={styles.spinner} />
                        ) : (
                            <>
                                <ShieldCheck size={16} />
                                Giriş Yap
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>Varsayılan: <strong>admin</strong> / <strong>admin123</strong></p>
                </div>
            </div>
        </div>
    );
}
