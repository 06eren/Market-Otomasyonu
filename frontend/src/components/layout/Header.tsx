"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, HelpCircle, Clock, ChevronRight, AlertTriangle, Package, Calendar } from 'lucide-react';
import styles from './Header.module.css';
import { Input } from '@/components/ui/Input';
import { getLowStockProducts } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

const pageNames: Record<string, string> = {
    '/': 'Genel Bakış',
    '/pos': 'Satış & POS',
    '/products': 'Ürün Yönetimi',
    '/customers': 'Müşteri Yönetimi',
    '/invoices': 'Fatura & Cari',
    '/reports': 'Raporlar & Analiz',
    '/settings': 'Ayarlar',
    '/stock-movements': 'Stok Hareketleri',
    '/cash-register': 'Kasa Yönetimi',
    '/employees': 'Personel Yönetimi',
    '/login': 'Giriş',
};

export default function Header() {
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [lowStock, setLowStock] = useState<any[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);
    const { employee } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
            setDate(now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' }));
        };
        tick();
        const interval = setInterval(tick, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        getLowStockProducts().then(data => setLowStock(data || []));
    }, []);

    // Dışarı tıklayınca kapat
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const pageName = pageNames[pathname] || 'Sayfa';

    return (
        <header className={styles.header}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
                <span className={styles.breadcrumbRoot}>MarketPro</span>
                <ChevronRight size={12} style={{ color: 'var(--text-muted)', margin: '0 0.25rem' }} />
                <span className={styles.breadcrumbCurrent}>{pageName}</span>
            </div>

            <div className={styles.actions}>
                <div className={styles.clock}>
                    <Calendar size={12} style={{ opacity: 0.5 }} />
                    <span className={styles.dateText}>{date}</span>
                    <div className={styles.clockDivider} />
                    <Clock size={12} />
                    <span>{time}</span>
                </div>

                {/* Bildirim Merkezi */}
                <div className={styles.notifWrapper} ref={notifRef}>
                    <button className={styles.iconBtn} title="Bildirimler" onClick={() => setShowNotifications(!showNotifications)}>
                        <Bell size={18} />
                        {lowStock.length > 0 && <span className={styles.notifDot}>{lowStock.length}</span>}
                    </button>

                    {showNotifications && (
                        <div className={styles.notifDropdown}>
                            <div className={styles.notifHeader}>
                                <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Bildirimler</span>
                                <span className={styles.notifCount}>{lowStock.length}</span>
                            </div>
                            <div className={styles.notifList}>
                                {lowStock.length === 0 ? (
                                    <div className={styles.notifEmpty}>Bildirim yok ✓</div>
                                ) : lowStock.map((p: any, i: number) => (
                                    <div key={i} className={styles.notifItem}>
                                        <div className={styles.notifIcon}><AlertTriangle size={14} style={{ color: p.StockQuantity === 0 ? 'var(--danger)' : 'var(--warning)' }} /></div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className={styles.notifText}>{p.Name}</div>
                                            <div className={styles.notifMeta}>
                                                {p.StockQuantity === 0 ? 'Stok tükendi!' : `Stok: ${p.StockQuantity} (Kritik: ${p.CriticalStockLevel})`}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button className={styles.iconBtn} title="Yardım">
                    <HelpCircle size={18} />
                </button>

                <div className={styles.divider} />

                <div className={styles.profile}>
                    <div className={styles.info}>
                        <span className={styles.name}>{employee?.FullName || 'Kullanıcı'}</span>
                        <span className={styles.role}>{employee?.RoleName === 'Admin' ? 'Yönetici' : employee?.RoleName === 'Manager' ? 'Müdür' : 'Kasiyer'}</span>
                    </div>
                    <div className={styles.avatar}>{employee?.FullName?.substring(0, 2).toUpperCase() || 'XX'}</div>
                </div>
            </div>
        </header>
    );
}
