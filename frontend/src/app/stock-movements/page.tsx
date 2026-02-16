"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Tabs } from '@/components/ui/Tabs';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ArrowDownToLine, ArrowUpFromLine, PackageSearch, RotateCcw, Plus, Search, Package, Calendar, FileText, ClipboardList } from 'lucide-react';
import styles from './stock.module.css';
import { getProducts, getCategories, updateProduct } from '@/lib/api';

interface StockMovement {
    id: string;
    productName: string;
    type: 'in' | 'out' | 'count' | 'return';
    quantity: number;
    note: string;
    date: string;
}

const typeLabels: Record<string, { label: string; color: string; variant: 'success' | 'danger' | 'warning' | 'info' }> = {
    in: { label: 'Stok Giriş', color: 'var(--success)', variant: 'success' },
    out: { label: 'Stok Çıkış', color: 'var(--danger)', variant: 'danger' },
    count: { label: 'Sayım', color: 'var(--info)', variant: 'info' },
    return: { label: 'İade', color: 'var(--warning)', variant: 'warning' },
};

export default function StockMovementsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [activeTab, setActiveTab] = useState('movements');
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    const [form, setForm] = useState({ productId: '', type: 'in' as string, quantity: 1, note: '' });

    useEffect(() => {
        getProducts().then(setProducts);
        // LocalStorage'dan hareketleri yükle
        const saved = localStorage.getItem('stock_movements');
        if (saved) setMovements(JSON.parse(saved));
    }, []);

    const saveMovements = (items: StockMovement[]) => {
        setMovements(items);
        localStorage.setItem('stock_movements', JSON.stringify(items));
    };

    const handleAddMovement = async () => {
        if (!form.productId) { showToast('Ürün seçin!', 'warning'); return; }
        if (form.quantity <= 0) { showToast('Miktar 0\'dan büyük olmalı!', 'warning'); return; }

        setSaving(true);
        const product = products.find(p => p.Id === parseInt(form.productId));
        if (!product) { showToast('Ürün bulunamadı', 'error'); setSaving(false); return; }

        let newStock = product.StockQuantity;
        if (form.type === 'in' || form.type === 'return') newStock += form.quantity;
        else if (form.type === 'out') {
            if (form.quantity > product.StockQuantity) { showToast('Yetersiz stok!', 'warning'); setSaving(false); return; }
            newStock -= form.quantity;
        }
        else if (form.type === 'count') newStock = form.quantity;

        const result = await updateProduct({ ...product, StockQuantity: newStock });
        if (result?.success) {
            const movement: StockMovement = {
                id: Date.now().toString(),
                productName: product.Name,
                type: form.type as any,
                quantity: form.quantity,
                note: form.note,
                date: new Date().toLocaleString('tr-TR'),
            };
            saveMovements([movement, ...movements]);
            showToast(`${typeLabels[form.type].label}: ${product.Name} — ${form.quantity} adet`, 'success');
            setShowAddModal(false);
            setForm({ productId: '', type: 'in', quantity: 1, note: '' });
            getProducts().then(setProducts);
        } else {
            showToast('Hata: ' + (result?.message || 'İşlem başarısız'), 'error');
        }
        setSaving(false);
    };

    const lowStockProducts = products.filter(p => p.StockQuantity <= (p.CriticalStockLevel || 10));
    const outOfStock = products.filter(p => p.StockQuantity === 0);

    const filteredMovements = movements.filter(m =>
        m.productName.toLowerCase().includes(searchTerm.toLowerCase()) || m.note.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { key: 'movements', label: 'Hareketler', icon: <ClipboardList size={14} />, count: movements.length },
        { key: 'overview', label: 'Stok Durumu', icon: <Package size={14} />, count: lowStockProducts.length },
    ];

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>Stok Hareketleri</h1>
                    <p className={styles.subtitle}>Mal giriş/çıkış, sayım ve iade takibi</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>Yeni Hareket</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <Card>
                    <div className={styles.miniStat}>
                        <ArrowDownToLine size={18} style={{ color: 'var(--success)' }} />
                        <div>
                            <div className={styles.miniLabel}>Toplam Giriş</div>
                            <div className={styles.miniValue}>{movements.filter(m => m.type === 'in').reduce((s, m) => s + m.quantity, 0)}</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className={styles.miniStat}>
                        <ArrowUpFromLine size={18} style={{ color: 'var(--danger)' }} />
                        <div>
                            <div className={styles.miniLabel}>Toplam Çıkış</div>
                            <div className={styles.miniValue}>{movements.filter(m => m.type === 'out').reduce((s, m) => s + m.quantity, 0)}</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className={styles.miniStat}>
                        <PackageSearch size={18} style={{ color: 'var(--info)' }} />
                        <div>
                            <div className={styles.miniLabel}>Sayım</div>
                            <div className={styles.miniValue}>{movements.filter(m => m.type === 'count').length}</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className={styles.miniStat}>
                        <RotateCcw size={18} style={{ color: 'var(--warning)' }} />
                        <div>
                            <div className={styles.miniLabel}>İade</div>
                            <div className={styles.miniValue}>{movements.filter(m => m.type === 'return').reduce((s, m) => s + m.quantity, 0)}</div>
                        </div>
                    </div>
                </Card>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {activeTab === 'movements' && (
                <Card noPadding>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                        <Input placeholder="Ürün adı veya not ile ara..." icon={<Search size={16} />} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ maxWidth: '400px' }} />
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>Tarih</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Tip</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Ürün</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Miktar</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Not</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMovements.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <ClipboardList size={28} style={{ opacity: 0.15, marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }} />
                                    Henüz stok hareketi yok
                                </td></tr>
                            ) : filteredMovements.map(m => (
                                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{m.date}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}><Badge variant={typeLabels[m.type].variant}>{typeLabels[m.type].label}</Badge></td>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{m.productName}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: m.type === 'out' ? 'var(--danger)' : 'var(--success)' }}>
                                        {m.type === 'out' ? '-' : '+'}{m.quantity}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{m.note || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <Card>
                        <h3 style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
                            <Package size={16} style={{ color: 'var(--warning)' }} /> Düşük Stok ({lowStockProducts.length})
                        </h3>
                        {lowStockProducts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Tüm stoklar yeterli ✓</div>
                        ) : lowStockProducts.map((p: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <span style={{ width: '140px', fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.Name}</span>
                                <div style={{ flex: 1 }}><ProgressBar value={p.StockQuantity} max={Math.max(p.CriticalStockLevel * 3, 1)} color={p.StockQuantity === 0 ? 'danger' : 'warning'} size="md" /></div>
                                <Badge variant={p.StockQuantity === 0 ? 'danger' : 'warning'}>{p.StockQuantity}</Badge>
                            </div>
                        ))}
                    </Card>
                    <Card>
                        <h3 style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
                            📊 Stok Özeti
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { label: 'Toplam Ürün', value: products.length },
                                { label: 'Stoklu Ürün', value: products.filter((p: any) => p.StockQuantity > 0).length },
                                { label: 'Tükenmiş', value: outOfStock.length },
                                { label: 'Düşük Stok', value: lowStockProducts.length },
                                { label: 'Toplam Stok Adedi', value: products.reduce((s: number, p: any) => s + (p.StockQuantity || 0), 0) },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none', fontSize: '0.8125rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                    <span style={{ fontWeight: 600 }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Yeni Hareket Modalı */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Yeni Stok Hareketi" size="md"
                footer={<><Button variant="outline" onClick={() => setShowAddModal(false)}>İptal</Button><Button onClick={handleAddMovement} isLoading={saving} icon={<Plus size={16} />}>Kaydet</Button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>Hareket Tipi</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
                            {Object.entries(typeLabels).map(([key, val]) => (
                                <button key={key} onClick={() => setForm({ ...form, type: key })}
                                    style={{ padding: '0.5rem', border: '1px solid', borderColor: form.type === key ? val.color : 'var(--border-strong)', background: form.type === key ? `${val.color}15` : 'transparent', color: form.type === key ? val.color : 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit' }}>
                                    {val.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>Ürün</label>
                        <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-body)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '0.875rem', fontFamily: 'inherit' }}>
                            <option value="">Ürün seçin...</option>
                            {products.map((p: any) => <option key={p.Id} value={p.Id}>{p.Name} (Stok: {p.StockQuantity})</option>)}
                        </select>
                    </div>
                    <Input label={form.type === 'count' ? 'Sayım Sonucu' : 'Miktar'} type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} />
                    <Input label="Not (İsteğe bağlı)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Tedarikçi adı, sebep vb." />
                </div>
            </Modal>
        </div>
    );
}
