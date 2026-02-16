"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, Wallet } from 'lucide-react';
import styles from '../dashboard.module.css';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/lib/api';

interface Customer {
    Id: number;
    FullName: string;
    PhoneNumber?: string;
    Email?: string;
    LoyaltyPoints: number;
    DebtBalance: number;
    CreatedAt: string;
}

const emptyCustomer = { FullName: '', PhoneNumber: '', Email: '' };

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formData, setFormData] = useState<any>(emptyCustomer);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => { loadCustomers(); }, []);

    const loadCustomers = async () => {
        setLoading(true);
        const data = await getCustomers();
        setCustomers(data);
        setLoading(false);
    };

    const filtered = customers.filter(c =>
        c.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.PhoneNumber?.includes(searchTerm) ||
        c.Email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = async () => {
        setSaving(true);
        const result = await addCustomer(formData);
        if (result?.success) {
            showToast('Müşteri eklendi', 'success');
            setShowAddModal(false);
            setFormData(emptyCustomer);
            await loadCustomers();
        } else {
            showToast(result?.message || 'Hata oluştu', 'error');
        }
        setSaving(false);
    };

    const handleEditOpen = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormData({ Id: customer.Id, FullName: customer.FullName, PhoneNumber: customer.PhoneNumber || '', Email: customer.Email || '' });
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        setSaving(true);
        const result = await updateCustomer(formData);
        if (result?.success) {
            showToast('Müşteri güncellendi', 'success');
            setShowEditModal(false);
            await loadCustomers();
        } else {
            showToast(result?.message || 'Güncelleme başarısız', 'error');
        }
        setSaving(false);
    };

    const handleDeleteConfirm = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!selectedCustomer) return;
        const result = await deleteCustomer(selectedCustomer.Id);
        if (result?.success) {
            showToast('Müşteri silindi', 'success');
            setShowDeleteModal(false);
            await loadCustomers();
        } else {
            showToast(result?.message || 'Silme başarısız', 'error');
        }
    };

    const CustomerForm = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Ad Soyad *" value={formData.FullName} onChange={e => setFormData({ ...formData, FullName: e.target.value })} placeholder="Müşteri adı soyadı" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input label="Telefon" value={formData.PhoneNumber} onChange={e => setFormData({ ...formData, PhoneNumber: e.target.value })} placeholder="05XX XXX XX XX" />
                <Input label="E-posta" value={formData.Email} onChange={e => setFormData({ ...formData, Email: e.target.value })} placeholder="ornek@email.com" />
            </div>
        </div>
    );

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>Müşteri Yönetimi</h1>
                    <p className={styles.subtitle}>CRM ve veresiye takibi — {customers.length} müşteri</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={() => { setFormData(emptyCustomer); setShowAddModal(true); }}>Yeni Müşteri</Button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent-subtle)' }}>
                            <Users size={18} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Toplam Müşteri</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{customers.length}</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--warning-bg)' }}>
                            <Wallet size={18} style={{ color: 'var(--warning)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Toplam Alacak</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>₺{customers.reduce((s, c) => s + (c.DebtBalance || 0), 0).toFixed(2)}</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)' }}>
                            <Wallet size={18} style={{ color: 'var(--danger)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Borçlu Müşteri</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{customers.filter(c => (c.DebtBalance || 0) > 0).length}</div>
                        </div>
                    </div>
                </Card>
            </div>

            <Card noPadding>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <Input placeholder="Ad, telefon veya e-posta ile ara..." icon={<Search size={16} />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ maxWidth: '400px' }} />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Ad Soyad</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Telefon</th>
                            <th style={{ padding: '0.75rem 1rem' }}>E-posta</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Puan</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Borç</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Kayıt</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Yükleniyor...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Müşteri bulunamadı.</td></tr>
                        ) : filtered.map(c => (
                            <tr key={c.Id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{c.FullName}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    {c.PhoneNumber ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={12} /> {c.PhoneNumber}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    {c.Email ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={12} /> {c.Email}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}><Badge variant="info">{c.LoyaltyPoints}</Badge></td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: c.DebtBalance > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
                                    ₺{(c.DebtBalance || 0).toFixed(2)}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.CreatedAt}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                        <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => handleEditOpen(c)} />
                                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} style={{ color: 'var(--danger)' }} onClick={() => handleDeleteConfirm(c)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {/* Add Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Yeni Müşteri" size="md"
                footer={<><Button variant="outline" onClick={() => setShowAddModal(false)}>İptal</Button><Button onClick={handleAdd} isLoading={saving} icon={<Plus size={16} />}>Ekle</Button></>}>
                <CustomerForm />
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Düzenle: ${selectedCustomer?.FullName}`} size="md"
                footer={<><Button variant="outline" onClick={() => setShowEditModal(false)}>İptal</Button><Button onClick={handleUpdate} isLoading={saving} icon={<Edit size={16} />}>Güncelle</Button></>}>
                <CustomerForm />
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Müşteri Sil" size="sm"
                footer={<><Button variant="outline" onClick={() => setShowDeleteModal(false)}>İptal</Button><Button variant="danger" onClick={handleDelete} icon={<Trash2 size={16} />}>Sil</Button></>}>
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <Users size={40} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
                    <p><strong>{selectedCustomer?.FullName}</strong> müşterisini silmek istediğinize emin misiniz?</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Bu işlem geri alınamaz.</p>
                </div>
            </Modal>
        </div>
    );
}
