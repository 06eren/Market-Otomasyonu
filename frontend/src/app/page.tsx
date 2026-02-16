"use client";

import styles from './dashboard.module.css';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ArrowUpRight, TrendingUp, Package, ShoppingCart, AlertTriangle, Clock, Download, Plus, DollarSign, Users, ArrowDownRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDashboardStats, getInvoices, getLowStockProducts, getProducts, getCustomers } from '@/lib/api';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState({ DailyTurnover: 0, DailyTransactions: 0, TotalStock: 0 });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats().then(data => setStats(data)),
      getInvoices().then(data => setRecentSales(data)),
      getLowStockProducts().then(data => setLowStock(data)),
      getProducts().then(data => setProducts(data)),
      getCustomers().then(data => setCustomers(data)),
    ]).then(() => setLoading(false));
  }, []);

  const avgBasket = stats.DailyTransactions > 0
    ? (stats.DailyTurnover / stats.DailyTransactions)
    : 0;

  const totalStockValue = products.reduce((s, p) => s + (p.SalePrice || 0) * (p.StockQuantity || 0), 0);
  const totalDebt = customers.reduce((s, c) => s + (c.DebtBalance || 0), 0);

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ height: '1.75rem', width: '200px', background: 'var(--bg-surface-active)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }} />
          <div style={{ height: '1rem', width: '320px', background: 'var(--bg-surface-active)', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <div className={styles.statsGrid}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Panel Özeti</h1>
          <p className={styles.subtitle}>Mağaza performansınız — Anlık veriler</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/reports"><Button variant="outline" icon={<Download size={16} />}>Detaylı Rapor</Button></Link>
          <Link href="/pos"><Button icon={<Plus size={16} />}>Yeni Satış</Button></Link>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Günlük Ciro</span>
            <div className={styles.statIconBox} style={{ background: 'var(--success-bg)' }}>
              <TrendingUp size={18} style={{ color: 'var(--success)' }} />
            </div>
          </div>
          <div className={styles.statValue}>₺{stats.DailyTurnover.toFixed(2)}</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <ArrowUpRight size={14} />
            <span>Bugün kazanılan gelir</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>İşlem Sayısı</span>
            <div className={styles.statIconBox} style={{ background: 'var(--accent-subtle)' }}>
              <ShoppingCart size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
          <div className={styles.statValue}>{stats.DailyTransactions}</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <ArrowUpRight size={14} />
            <span>Ort. sepet: ₺{avgBasket.toFixed(2)}</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Stok Değeri</span>
            <div className={styles.statIconBox} style={{ background: 'var(--warning-bg)' }}>
              <Package size={18} style={{ color: 'var(--warning)' }} />
            </div>
          </div>
          <div className={styles.statValue}>₺{totalStockValue.toFixed(0)}</div>
          <div className={styles.statChange}>
            <span style={{ color: 'var(--text-muted)' }}>{products.length} çeşit — {stats.TotalStock} adet</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statLabel}>Toplam Alacak</span>
            <div className={styles.statIconBox} style={{ background: totalDebt > 0 ? 'var(--danger-bg)' : 'var(--success-bg)' }}>
              <DollarSign size={18} style={{ color: totalDebt > 0 ? 'var(--danger)' : 'var(--success)' }} />
            </div>
          </div>
          <div className={styles.statValue}>₺{totalDebt.toFixed(2)}</div>
          <div className={styles.statChange}>
            <Users size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-muted)' }}>{customers.length} müşteri</span>
          </div>
        </Card>
      </div>

      {/* Haftalık Satış Grafiği (CSS Bar Chart) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Card>
          <div className={styles.panelHeader} style={{ marginBottom: '1rem' }}>
            <h3 className={styles.panelTitle}><TrendingUp size={16} /> Son 7 Gün — Satış Trendi</h3>
          </div>
          <div className={styles.barChart}>
            {(() => {
              const days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i));
                return { date: d, label: d.toLocaleDateString('tr-TR', { weekday: 'short' }), day: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) };
              });
              const salesByDay = days.map(d => {
                const dayStr = d.date.toLocaleDateString('tr-TR').substring(0, 10);
                const count = recentSales.filter(s => s.Date?.includes(dayStr.substring(0, 5))).length;
                const total = recentSales.filter(s => s.Date?.includes(dayStr.substring(0, 5))).reduce((sum: number, s: any) => sum + (s.Amount || 0), 0);
                return { ...d, count, total };
              });
              const maxTotal = Math.max(...salesByDay.map(d => d.total), 1);
              return salesByDay.map((d, i) => (
                <div key={i} className={styles.barColumn}>
                  <div className={styles.barValue}>₺{d.total > 0 ? d.total.toFixed(0) : '0'}</div>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ height: `${Math.max((d.total / maxTotal) * 100, 4)}%` }} />
                  </div>
                  <div className={styles.barLabel}>{d.label}</div>
                  <div className={styles.barDate}>{d.day}</div>
                </div>
              ));
            })()}
          </div>
        </Card>
      </div>

      {/* 3 Sütunlu İçerik */}
      <div className={styles.contentGrid}>
        {/* Son İşlemler */}
        <Card noPadding className={styles.mainPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>
              <Clock size={16} /> Son İşlemler
            </h3>
            <Link href="/invoices" className={styles.panelLink}>Tümünü Gör →</Link>
          </div>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.25rem' }}>İşlem No</th>
                <th>Tarih</th>
                <th style={{ textAlign: 'right' }}>Tutar</th>
                <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Durum</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr><td colSpan={4} className={styles.emptyRow}>
                  <div className={styles.emptyState}>
                    <ShoppingCart size={28} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                    <div>Henüz satış işlemi yapılmadı</div>
                    <Link href="/pos" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: '0.25rem' }}>İlk satışı başlat →</Link>
                  </div>
                </td></tr>
              ) : recentSales.slice(0, 7).map((sale, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: '1.25rem' }}>
                    <span className={styles.mono}>#{sale.Id}</span>
                  </td>
                  <td>{sale.Date}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>₺{sale.Amount?.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                    <Badge variant="success">{sale.Status || 'Tamamlandı'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Sağ Panel */}
        <div className={styles.sidePanel}>
          {/* Düşük Stok */}
          <Card noPadding>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>
                <AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> Stok Uyarıları
              </h3>
              <Badge variant={lowStock.length > 0 ? 'danger' : 'success'}>{lowStock.length}</Badge>
            </div>
            <div style={{ padding: '0.5rem' }}>
              {lowStock.length === 0 ? (
                <div className={styles.emptyState} style={{ padding: '1.5rem 0' }}>
                  <Package size={24} style={{ opacity: 0.15, marginBottom: '0.5rem' }} />
                  <div>Stoklar yeterli seviyede ✓</div>
                </div>
              ) : lowStock.slice(0, 5).map((item: any, i: number) => (
                <div key={i} className={styles.alertItem}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.alertName}>{item.Name}</div>
                    <ProgressBar
                      value={item.StockQuantity}
                      max={Math.max(item.CriticalStockLevel * 2, 1)}
                      color={item.StockQuantity === 0 ? 'danger' : 'warning'}
                      size="sm"
                    />
                  </div>
                  <Badge variant={item.StockQuantity === 0 ? 'danger' : 'warning'}>
                    {item.StockQuantity}
                  </Badge>
                </div>
              ))}
            </div>
            {lowStock.length > 5 && (
              <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <Link href="/products" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>+{lowStock.length - 5} ürün daha →</Link>
              </div>
            )}
          </Card>

          {/* Hızlı Erişim */}
          <Card>
            <h3 className={styles.panelTitle} style={{ marginBottom: '0.75rem' }}>⚡ Hızlı Erişim</h3>
            <div className={styles.quickActions}>
              <Link href="/pos"><Button variant="outline" size="sm" fullWidth icon={<ShoppingCart size={14} />}>Yeni Satış</Button></Link>
              <Link href="/products"><Button variant="outline" size="sm" fullWidth icon={<Package size={14} />}>Ürün Ekle</Button></Link>
              <Link href="/customers"><Button variant="outline" size="sm" fullWidth icon={<Users size={14} />}>Müşteriler</Button></Link>
              <Link href="/reports"><Button variant="outline" size="sm" fullWidth icon={<TrendingUp size={14} />}>Raporlar</Button></Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
