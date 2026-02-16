"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonCard, SkeletonTable, SkeletonKPI, SkeletonChart } from '@/components/ui/Skeleton';
import { PageTransition } from '@/components/ui/PageTransition';
import {
    TrendingUp, Package, ShoppingCart, Wallet, BarChart3, PieChart, Calendar,
    ArrowUp, ArrowDown, DollarSign, Users, AlertTriangle, FileText, Download
} from 'lucide-react';
import styles from './reports.module.css';
import { getInvoices, getProducts, getCustomers, getDashboardStats } from '@/lib/api';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [sales, setSales] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ DailyTurnover: 0, DailyTransactions: 0, TotalStock: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getInvoices().then(d => setSales(d)),
            getProducts().then(d => setProducts(d)),
            getCustomers().then(d => setCustomers(d)),
            getDashboardStats().then(d => setStats(d))
        ]).then(() => setLoading(false));
    }, []);

    // Hesaplamalar
    const totalRevenue = sales.reduce((s, sale) => s + (sale.Amount || 0), 0);
    const totalCost = products.reduce((s, p) => s + (p.PurchasePrice || 0) * (p.StockQuantity || 0), 0);
    const totalStockValue = products.reduce((s, p) => s + (p.SalePrice || 0) * (p.StockQuantity || 0), 0);
    const lowStockCount = products.filter(p => p.StockQuantity <= (p.CriticalStockLevel || 10)).length;
    const outOfStockCount = products.filter(p => p.StockQuantity === 0).length;
    const totalDebt = customers.reduce((s, c) => s + (c.DebtBalance || 0), 0);
    const avgPrice = products.length > 0 ? products.reduce((s: number, p: any) => s + (p.SalePrice || 0), 0) / products.length : 0;

    // Kategori bazlı dağılım
    const categoryDistribution = useMemo(() => {
        const map: Record<string, { count: number; value: number }> = {};
        products.forEach((p: any) => {
            const cat = p.Category?.Name || 'Genel';
            if (!map[cat]) map[cat] = { count: 0, value: 0 };
            map[cat].count += 1;
            map[cat].value += (p.SalePrice || 0) * (p.StockQuantity || 0);
        });
        return Object.entries(map).map(([name, data]) => ({ name, ...data }));
    }, [products]);

    // En çok satan ürünler (stok azalma tahmini)
    const topProducts = useMemo(() => {
        return [...products]
            .sort((a, b) => (a.StockQuantity || 0) - (b.StockQuantity || 0))
            .slice(0, 8);
    }, [products]);

    const tabs = [
        { key: 'overview', label: 'Genel Bakış', icon: <BarChart3 size={14} /> },
        { key: 'products', label: 'Ürün Analizi', icon: <Package size={14} />, count: products.length },
        { key: 'financial', label: 'Finansal', icon: <DollarSign size={14} /> },
    ];

    if (loading) {
        return (
            <div>
                <SkeletonKPI count={4} />
                <div style={{ marginTop: '1.5rem' }}><SkeletonChart /></div>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>Raporlar & Analiz</h1>
                    <p className={styles.subtitle}>Detaylı iş performans analizi ve finansal özetler</p>
                </div>
                <Button variant="outline" icon={<Download size={16} />}>Rapor İndir</Button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {/* ════════════════ GENEL BAKIŞ ════════════════ */}
            {activeTab === 'overview' && (
                <>
                    {/* KPI Kartları */}
                    <div className={styles.kpiGrid}>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon} style={{ background: 'var(--success-bg)' }}>
                                <TrendingUp size={20} style={{ color: 'var(--success)' }} />
                            </div>
                            <div>
                                <div className={styles.kpiLabel}>Toplam Gelir</div>
                                <div className={styles.kpiValue}>₺{totalRevenue.toFixed(2)}</div>
                                <div className={styles.kpiMeta}>
                                    <ArrowUp size={12} style={{ color: 'var(--success)' }} />
                                    <span style={{ color: 'var(--success)' }}>{sales.length} işlem</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon} style={{ background: 'var(--accent-subtle)' }}>
                                <Package size={20} style={{ color: 'var(--accent-primary)' }} />
                            </div>
                            <div>
                                <div className={styles.kpiLabel}>Stok Değeri</div>
                                <div className={styles.kpiValue}>₺{totalStockValue.toFixed(0)}</div>
                                <div className={styles.kpiMeta}>
                                    <span>{products.length} ürün envanteri</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon} style={{ background: 'var(--warning-bg)' }}>
                                <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                            </div>
                            <div>
                                <div className={styles.kpiLabel}>Stok Uyarısı</div>
                                <div className={styles.kpiValue}>{lowStockCount}</div>
                                <div className={styles.kpiMeta}>
                                    <span style={{ color: outOfStockCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                        {outOfStockCount} tükenmiş
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon} style={{ background: 'var(--danger-bg)' }}>
                                <Wallet size={20} style={{ color: 'var(--danger)' }} />
                            </div>
                            <div>
                                <div className={styles.kpiLabel}>Toplam Alacak</div>
                                <div className={styles.kpiValue}>₺{totalDebt.toFixed(2)}</div>
                                <div className={styles.kpiMeta}>
                                    <span>{customers.filter(c => (c.DebtBalance || 0) > 0).length} borçlu müşteri</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* İki Sütunlu Detay */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Kategori Dağılımı */}
                        <Card>
                            <h3 className={styles.sectionTitle}><PieChart size={16} /> Kategori Dağılımı</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {categoryDistribution.map((cat, i) => {
                                    const maxVal = Math.max(...categoryDistribution.map(c => c.value));
                                    const colors: Array<'accent' | 'success' | 'warning' | 'danger'> = ['accent', 'success', 'warning', 'danger'];
                                    return (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{cat.name}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cat.count} ürün — ₺{cat.value.toFixed(0)}</span>
                                            </div>
                                            <ProgressBar value={cat.value} max={maxVal} color={colors[i % colors.length]} size="md" />
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Son Satışlar Özeti */}
                        <Card>
                            <h3 className={styles.sectionTitle}><FileText size={16} /> Satış Performansı</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className={styles.miniStat}>
                                    <div className={styles.miniLabel}>Günlük Ciro</div>
                                    <div className={styles.miniValue}>₺{stats.DailyTurnover?.toFixed(2) || '0.00'}</div>
                                </div>
                                <div className={styles.miniStat}>
                                    <div className={styles.miniLabel}>Günlük İşlem</div>
                                    <div className={styles.miniValue}>{stats.DailyTransactions || 0}</div>
                                </div>
                                <div className={styles.miniStat}>
                                    <div className={styles.miniLabel}>Ort. Sepet</div>
                                    <div className={styles.miniValue}>₺{stats.DailyTransactions > 0 ? (stats.DailyTurnover / stats.DailyTransactions).toFixed(2) : '0.00'}</div>
                                </div>
                                <div className={styles.miniStat}>
                                    <div className={styles.miniLabel}>Ort. Ürün Fiyatı</div>
                                    <div className={styles.miniValue}>₺{avgPrice.toFixed(2)}</div>
                                </div>
                            </div>
                            <div style={{ padding: '0.75rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    <span>Toplam Müşteri</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{customers.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                    <span>Aktif Ürün</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{products.filter(p => p.StockQuantity > 0).length} / {products.length}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </>
            )}

            {/* ════════════════ ÜRÜN ANALİZİ ════════════════ */}
            {activeTab === 'products' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <Card>
                            <h3 className={styles.sectionTitle}><AlertTriangle size={16} /> Stok Durumu Haritası</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {topProducts.map((p: any, idx: number) => {
                                    const maxStock = Math.max(...products.map((pr: any) => pr.StockQuantity || 1));
                                    return (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ width: '140px', fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.Name}</span>
                                            <div style={{ flex: 1 }}>
                                                <ProgressBar
                                                    value={p.StockQuantity}
                                                    max={maxStock}
                                                    color={p.StockQuantity === 0 ? 'danger' : p.StockQuantity <= (p.CriticalStockLevel || 10) ? 'warning' : 'success'}
                                                    size="md"
                                                />
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>{p.StockQuantity}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card>
                            <h3 className={styles.sectionTitle}><DollarSign size={16} /> Fiyat & Kâr Analizi</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Ürün</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Alış</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Satış</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Kâr %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.slice(0, 10).map((p: any, i: number) => {
                                        const profit = p.PurchasePrice > 0 ? ((p.SalePrice - p.PurchasePrice) / p.PurchasePrice * 100) : 0;
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '0.5rem', fontWeight: 500 }}>{p.Name}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>₺{(p.PurchasePrice || 0).toFixed(2)}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>₺{(p.SalePrice || 0).toFixed(2)}</td>
                                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                    <Badge variant={profit > 20 ? 'success' : profit > 0 ? 'warning' : 'danger'}>
                                                        %{profit.toFixed(1)}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                </>
            )}

            {/* ════════════════ FİNANSAL ════════════════ */}
            {activeTab === 'financial' && (
                <>
                    <div className={styles.kpiGrid}>
                        <div className={styles.kpiCard} style={{ borderLeft: '3px solid var(--success)' }}>
                            <div>
                                <div className={styles.kpiLabel}>Toplam Satış Geliri</div>
                                <div className={styles.kpiValue} style={{ color: 'var(--success)' }}>₺{totalRevenue.toFixed(2)}</div>
                            </div>
                        </div>
                        <div className={styles.kpiCard} style={{ borderLeft: '3px solid var(--accent-primary)' }}>
                            <div>
                                <div className={styles.kpiLabel}>Stok Yatırımı (Maliyet)</div>
                                <div className={styles.kpiValue}>₺{totalCost.toFixed(0)}</div>
                            </div>
                        </div>
                        <div className={styles.kpiCard} style={{ borderLeft: '3px solid var(--warning)' }}>
                            <div>
                                <div className={styles.kpiLabel}>Stok Satış Değeri</div>
                                <div className={styles.kpiValue}>₺{totalStockValue.toFixed(0)}</div>
                            </div>
                        </div>
                        <div className={styles.kpiCard} style={{ borderLeft: '3px solid var(--danger)' }}>
                            <div>
                                <div className={styles.kpiLabel}>Açık Alacaklar</div>
                                <div className={styles.kpiValue} style={{ color: 'var(--danger)' }}>₺{totalDebt.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <Card>
                            <h3 className={styles.sectionTitle}><Users size={16} /> Borçlu Müşteriler</h3>
                            {customers.filter(c => (c.DebtBalance || 0) > 0).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Borçlu müşteri bulunmuyor ✓
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {customers.filter(c => (c.DebtBalance || 0) > 0).sort((a, b) => b.DebtBalance - a.DebtBalance).map((c: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '0.8125rem' }}>{c.FullName}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.PhoneNumber || 'Telefon yok'}</div>
                                            </div>
                                            <span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.875rem' }}>₺{c.DebtBalance.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card>
                            <h3 className={styles.sectionTitle}><BarChart3 size={16} /> Özet Metrikler</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[
                                    { label: 'Toplam Ürün Çeşidi', value: products.length, suffix: 'adet' },
                                    { label: 'Aktif Stoklu Ürün', value: products.filter((p: any) => p.StockQuantity > 0).length, suffix: 'adet' },
                                    { label: 'Tükenmiş Ürün', value: outOfStockCount, suffix: 'adet' },
                                    { label: 'Toplam Müşteri', value: customers.length, suffix: 'kişi' },
                                    { label: 'Ortalama Ürün Fiyatı', value: `₺${avgPrice.toFixed(2)}`, suffix: '' },
                                    { label: 'Toplam İşlem', value: sales.length, suffix: 'adet' },
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 5 ? '1px solid var(--border-subtle)' : 'none', fontSize: '0.8125rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                        <span style={{ fontWeight: 600 }}>{item.value} {item.suffix}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </PageTransition>
    );
}
