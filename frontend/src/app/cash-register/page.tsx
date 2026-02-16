"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Tabs } from '@/components/ui/Tabs';
import { Wallet, Lock, Unlock, FileText, Banknote, CreditCard, TrendingUp, TrendingDown, Calculator, Calendar, Printer, Clock } from 'lucide-react';
import styles from './cash.module.css';
import { getDashboardStats, getInvoices } from '@/lib/api';

interface CashSession {
    id: string;
    openedAt: string;
    closedAt?: string;
    openingAmount: number;
    closingAmount?: number;
    closingCashCount?: number;
    totalCash: number;
    totalCard: number;
    totalDebt: number;
    totalSales: number;
    transactionCount: number;
    difference?: number;
    status: 'open' | 'closed';
}

export default function CashRegisterPage() {
    const [activeTab, setActiveTab] = useState('current');
    const [sessions, setSessions] = useState<CashSession[]>([]);
    const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [openingAmount, setOpeningAmount] = useState(100);
    const [closingCashCount, setClosingCashCount] = useState(0);
    const [stats, setStats] = useState<any>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const saved = localStorage.getItem('cash_sessions');
        if (saved) {
            const data = JSON.parse(saved);
            setSessions(data);
            const open = data.find((s: CashSession) => s.status === 'open');
            if (open) setCurrentSession(open);
        }
        getDashboardStats().then(setStats);
    }, []);

    const saveSessions = (items: CashSession[]) => {
        setSessions(items);
        localStorage.setItem('cash_sessions', JSON.stringify(items));
    };

    const handleOpenRegister = () => {
        if (currentSession) { showToast('Kasa zaten açık!', 'warning'); return; }
        const session: CashSession = {
            id: Date.now().toString(),
            openedAt: new Date().toLocaleString('tr-TR'),
            openingAmount: openingAmount,
            totalCash: 0, totalCard: 0, totalDebt: 0,
            totalSales: 0, transactionCount: 0,
            status: 'open'
        };
        setCurrentSession(session);
        const updated = [session, ...sessions];
        saveSessions(updated);
        setShowOpenModal(false);
        showToast(`Kasa açıldı! Başlangıç: ₺${openingAmount.toFixed(2)}`, 'success');
    };

    const handleCloseRegister = () => {
        if (!currentSession) return;
        const expectedCash = currentSession.openingAmount + (stats?.DailyTurnover || 0) * 0.6; // ~60% nakit tahmini
        const diff = closingCashCount - expectedCash;

        const closed: CashSession = {
            ...currentSession,
            closedAt: new Date().toLocaleString('tr-TR'),
            closingAmount: closingCashCount,
            closingCashCount: closingCashCount,
            totalSales: stats?.DailyTurnover || 0,
            transactionCount: stats?.DailyTransactions || 0,
            difference: diff,
            status: 'closed'
        };
        setCurrentSession(null);
        const updated = sessions.map(s => s.id === closed.id ? closed : s);
        saveSessions(updated);
        setShowCloseModal(false);
        showToast('Kasa kapatıldı! Z Raporu oluşturuldu.', 'success');
    };

    const closedSessions = sessions.filter(s => s.status === 'closed');

    const tabs = [
        { key: 'current', label: 'Kasa Durumu', icon: <Wallet size={14} /> },
        { key: 'history', label: 'Z Raporu Geçmişi', icon: <FileText size={14} />, count: closedSessions.length },
    ];

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>Kasa Yönetimi</h1>
                    <p className={styles.subtitle}>Kasa aç/kapa, Z raporu ve nakit sayım</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!currentSession ? (
                        <Button icon={<Unlock size={16} />} onClick={() => setShowOpenModal(true)}>Kasa Aç</Button>
                    ) : (
                        <Button variant="danger" icon={<Lock size={16} />} onClick={() => { setClosingCashCount(0); setShowCloseModal(true); }}>Kasa Kapat</Button>
                    )}
                </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {activeTab === 'current' && (
                <>
                    {/* Kasa durumu */}
                    {currentSession ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                            <Card>
                                <div className={styles.miniStat}>
                                    <div className={styles.iconWrap} style={{ background: 'var(--success-bg)' }}><Unlock size={18} style={{ color: 'var(--success)' }} /></div>
                                    <div><div className={styles.miniLabel}>Kasa Durumu</div><div className={styles.miniValue} style={{ color: 'var(--success)' }}>AÇIK</div></div>
                                </div>
                            </Card>
                            <Card>
                                <div className={styles.miniStat}>
                                    <div className={styles.iconWrap} style={{ background: 'var(--accent-subtle)' }}><Clock size={18} style={{ color: 'var(--accent-primary)' }} /></div>
                                    <div><div className={styles.miniLabel}>Açılış</div><div className={styles.miniValue2}>{currentSession.openedAt}</div></div>
                                </div>
                            </Card>
                            <Card>
                                <div className={styles.miniStat}>
                                    <div className={styles.iconWrap} style={{ background: 'var(--accent-subtle)' }}><Banknote size={18} style={{ color: 'var(--accent-primary)' }} /></div>
                                    <div><div className={styles.miniLabel}>Başlangıç</div><div className={styles.miniValue}>₺{currentSession.openingAmount.toFixed(2)}</div></div>
                                </div>
                            </Card>
                            <Card>
                                <div className={styles.miniStat}>
                                    <div className={styles.iconWrap} style={{ background: 'var(--success-bg)' }}><TrendingUp size={18} style={{ color: 'var(--success)' }} /></div>
                                    <div><div className={styles.miniLabel}>Günlük Ciro</div><div className={styles.miniValue}>₺{(stats?.DailyTurnover || 0).toFixed(2)}</div></div>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <Card>
                            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                <Lock size={40} style={{ opacity: 0.12, marginBottom: '1rem' }} />
                                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Kasa Kapalı</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                    Satış yapmak için kasayı açın. Başlangıç tutarını girerek günü başlatabilirsiniz.
                                </p>
                                <Button icon={<Unlock size={16} />} onClick={() => setShowOpenModal(true)}>Kasayı Aç</Button>
                            </div>
                        </Card>
                    )}

                    {/* Günlük Anlık Özet */}
                    {currentSession && stats && (
                        <Card>
                            <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9375rem' }}>📊 Anlık Gün Sonu Özeti</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>İşlem Sayısı</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.DailyTransactions}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Toplam Ciro</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>₺{stats.DailyTurnover.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Tahmini Kasa</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₺{(currentSession.openingAmount + stats.DailyTurnover * 0.6).toFixed(2)}</div>
                                </div>
                            </div>
                        </Card>
                    )}
                </>
            )}

            {activeTab === 'history' && (
                <Card noPadding>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>Açılış</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Kapanış</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Başlangıç</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Toplam Ciro</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>İşlem</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Sayım</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Fark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {closedSessions.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <FileText size={28} style={{ opacity: 0.15, display: 'block', margin: '0 auto 0.5rem' }} />
                                    Henüz Z raporu yok
                                </td></tr>
                            ) : closedSessions.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>{s.openedAt}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>{s.closedAt}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>₺{s.openingAmount.toFixed(2)}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>₺{s.totalSales.toFixed(2)}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{s.transactionCount}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>₺{(s.closingCashCount || 0).toFixed(2)}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                        <Badge variant={(s.difference || 0) >= 0 ? 'success' : 'danger'}>
                                            {(s.difference || 0) >= 0 ? '+' : ''}₺{(s.difference || 0).toFixed(2)}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* Kasa Aç Modalı */}
            <Modal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} title="Kasa Aç" size="sm"
                footer={<><Button variant="outline" onClick={() => setShowOpenModal(false)}>İptal</Button><Button onClick={handleOpenRegister} icon={<Unlock size={16} />}>Kasayı Aç</Button></>}>
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <Wallet size={40} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Kasadaki başlangıç nakit tutarını girin:</p>
                    <Input type="number" min="0" value={openingAmount} onChange={e => setOpeningAmount(parseFloat(e.target.value) || 0)} label="Başlangıç Tutarı (₺)" />
                </div>
            </Modal>

            {/* Kasa Kapat Modalı */}
            <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Kasa Kapat — Z Raporu" size="md"
                footer={<><Button variant="outline" onClick={() => setShowCloseModal(false)}>İptal</Button><Button variant="danger" onClick={handleCloseRegister} icon={<Lock size={16} />}>Kasayı Kapat</Button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem' }}>📋 Gün Sonu Bilgileri</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
                            <div><span style={{ color: 'var(--text-muted)' }}>Açılış:</span> {currentSession?.openedAt}</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Şimdi:</span> {new Date().toLocaleString('tr-TR')}</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Başlangıç:</span> ₺{currentSession?.openingAmount.toFixed(2)}</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Ciro:</span> <strong>₺{(stats?.DailyTurnover || 0).toFixed(2)}</strong></div>
                        </div>
                    </div>
                    <Input type="number" min="0" value={closingCashCount} onChange={e => setClosingCashCount(parseFloat(e.target.value) || 0)} label="Kasadaki Nakit (Sayım Sonucu) ₺" />
                    {closingCashCount > 0 && (
                        <div style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tahmini Fark</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: (closingCashCount - (currentSession?.openingAmount || 0)) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                {(closingCashCount - (currentSession?.openingAmount || 0)) >= 0 ? '+' : ''}₺{(closingCashCount - (currentSession?.openingAmount || 0) - (stats?.DailyTurnover || 0) * 0.6).toFixed(2)}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
