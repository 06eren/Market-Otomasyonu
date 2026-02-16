"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FileText, Eye, Search, Calendar } from 'lucide-react';
import styles from '../dashboard.module.css';
import { getInvoices } from '@/lib/api';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        setLoading(true);
        const data = await getInvoices();
        setInvoices(data);
        setLoading(false);
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchSearch = !searchTerm || inv.Id?.toLowerCase().includes(searchTerm.toLowerCase());
        if (dateFilter === 'today') {
            const today = new Date().toLocaleDateString('tr-TR');
            return matchSearch && inv.Date?.includes(today.substring(0, 10));
        }
        return matchSearch;
    });

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>Faturalar & Cari</h1>
                    <p className={styles.subtitle}>Geçmiş satışlar ve fatura dökümleri — {invoices.length} kayıt</p>
                </div>
            </div>

            <Card noPadding>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Input
                        placeholder="Fatura numarası ile ara..."
                        icon={<Search size={16} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ maxWidth: '300px' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['all', 'today'].map(f => (
                            <button key={f} onClick={() => setDateFilter(f)} style={{
                                padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-sm)',
                                border: '1px solid', fontSize: '0.8125rem', cursor: 'pointer',
                                background: dateFilter === f ? 'var(--accent-subtle)' : 'transparent',
                                borderColor: dateFilter === f ? 'var(--accent-border)' : 'var(--border-strong)',
                                color: dateFilter === f ? 'var(--accent-primary)' : 'var(--text-secondary)'
                            }}>
                                {f === 'all' ? 'Tümü' : 'Bugün'}
                            </button>
                        ))}
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '0.75rem 1.25rem' }}>Fatura No</th>
                            <th style={{ padding: '0.75rem' }}>Tarih</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tutar</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Durum</th>
                            <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Yükleniyor...</td></tr>
                        ) : filteredInvoices.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Kayıt bulunamadı.</td></tr>
                        ) : filteredInvoices.map((inv, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'monospace', fontWeight: 500 }}>{inv.Id}</td>
                                <td style={{ padding: '0.75rem' }}>{inv.Date}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>₺{inv.Amount?.toFixed(2)}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <Badge variant={inv.Status === 'Tamamlandı' ? 'success' : 'warning'}>{inv.Status}</Badge>
                                </td>
                                <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                                    <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => setSelectedInvoice(inv)}>İncele</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {/* Invoice Detail Modal */}
            <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Fatura Detayı: ${selectedInvoice?.Id}`} size="md"
                footer={<Button variant="outline" onClick={() => setSelectedInvoice(null)}>Kapat</Button>}>
                {selectedInvoice && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fatura No</div>
                                <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedInvoice.Id}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tarih</div>
                                <div style={{ fontWeight: 500 }}>{selectedInvoice.Date}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Toplam Tutar</div>
                                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-primary)' }}>₺{selectedInvoice.Amount?.toFixed(2)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Durum</div>
                                <Badge variant={selectedInvoice.Status === 'Tamamlandı' ? 'success' : 'warning'}>{selectedInvoice.Status}</Badge>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
