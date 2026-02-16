"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, FileText, Settings, LogOut, Users, BarChart3, ArrowRightLeft, Wallet, UserCog, Calculator } from 'lucide-react';
import styles from './Sidebar.module.css';
import { Button } from '@/components/ui/Button';
import { getLowStockProducts } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import eventBus from '@/lib/eventBus';

const menuGroups = [
    {
        title: 'SATIŞ',
        items: [
            { name: 'Genel Bakış', icon: LayoutDashboard, path: '/', roles: [0, 1] },
            { name: 'Satış & POS', icon: ShoppingCart, path: '/pos', roles: [0, 1, 2] },
            { name: 'Kasa Yönetimi', icon: Wallet, path: '/cash-register', roles: [0, 1, 2] },
        ]
    },
    {
        title: 'ENVANTER',
        items: [
            { name: 'Ürün Yönetimi', icon: Package, path: '/products', roles: [0, 1], badgeKey: 'lowStock' },
            { name: 'Stok Hareketleri', icon: ArrowRightLeft, path: '/stock-movements', roles: [0, 1] },
        ]
    },
    {
        title: 'YÖNETİM',
        items: [
            { name: 'Müşteriler', icon: Users, path: '/customers', roles: [0, 1] },
            { name: 'Fatura & Cari', icon: FileText, path: '/invoices', roles: [0, 1, 2] },
            { name: 'Raporlar', icon: BarChart3, path: '/reports', roles: [0, 1] },
            { name: 'Muhasebe', icon: Calculator, path: '/accounting', roles: [0, 1] },
        ]
    },
    {
        title: 'SİSTEM',
        items: [
            { name: 'Personel', icon: UserCog, path: '/employees', roles: [0] },
            { name: 'Ayarlar', icon: Settings, path: '/settings', roles: [0] },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { employee, logout } = useAuth();
    const [lowStockCount, setLowStockCount] = useState(0);

    const refreshLowStock = () => {
        getLowStockProducts().then(data => setLowStockCount(data?.length || 0));
    };

    useEffect(() => {
        refreshLowStock();
        const unsub = eventBus.on('stock-change', refreshLowStock);
        return () => unsub();
    }, []);

    const userRole = employee?.Role ?? 2;

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <img src="/favicon.png" alt="InnoApp" className={styles.logoBox} style={{ borderRadius: 6, objectFit: 'contain' }} />
                <h1 className={styles.title}>
                    Inno<span style={{ color: 'var(--text-secondary)' }}>App</span>
                </h1>
            </div>

            <nav className={styles.nav}>
                {menuGroups.map((group) => {
                    const visibleItems = group.items.filter(item => item.roles.includes(userRole));
                    if (visibleItems.length === 0) return null;
                    return (
                        <div key={group.title} className={styles.menuGroup}>
                            <div className={styles.groupTitle}>{group.title}</div>
                            {visibleItems.map((item) => {
                                const isActive = pathname === item.path;
                                const badge = (item as any).badgeKey === 'lowStock' && lowStockCount > 0 ? lowStockCount : 0;
                                return (
                                    <Link key={item.path} href={item.path} className={`${styles.menuItem} ${isActive ? styles.active : ''}`}>
                                        <item.icon size={18} className={styles.icon} />
                                        <span>{item.name}</span>
                                        {badge > 0 && <span className={styles.badge}>{badge}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                {employee && (
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>{employee.FullName.substring(0, 2).toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.userName}>{employee.FullName}</div>
                            <div className={styles.userRole}>{employee.RoleName === 'Admin' ? 'Yönetici' : employee.RoleName === 'Manager' ? 'Müdür' : 'Kasiyer'}</div>
                        </div>
                    </div>
                )}
                <div className={styles.version}>InnoApp v1.0.0</div>
                <Button variant="ghost" fullWidth icon={<LogOut size={16} />} style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)' }} onClick={logout}>
                    Oturumu Kapat
                </Button>
            </div>
        </aside>
    );
}
