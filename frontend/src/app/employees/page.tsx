"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { UserCog, Plus, Shield, Edit, Trash2, Activity, Clock, User, Lock } from 'lucide-react';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, getActivityLog } from '@/lib/api';

const roleLabels: Record<number, string> = { 0: 'Yönetici', 1: 'Müdür', 2: 'Kasiyer' };
const roleColors: Record<number, string> = { 0: 'danger', 1: 'warning', 2: 'neutral' };

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [activityLog, setActivityLog] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('list');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTarget, setEditTarget] = useState<any>(null);
    const { showToast } = useToast();

    const [form, setForm] = useState({ Username: '', Password: '', FullName: '', Role: 2 });
    const [editForm, setEditForm] = useState({ Id: 0, FullName: '', Role: 2, Password: '', IsActive: true });

    const load = () => {
        getEmployees().then(setEmployees);
        getActivityLog(100).then(setActivityLog);
    };
    useEffect(() => { load(); }, []);

    const handleAdd = async () => {
        if (!form.Username.trim() || !form.Password.trim() || !form.FullName.trim()) {
            showToast('Tüm alanlar zorunludur.', 'warning'); return;
        }
        const result = await addEmployee(form);
        if (result?.success) {
            showToast('Personel eklendi.', 'success');
            setShowAddModal(false);
            setForm({ Username: '', Password: '', FullName: '', Role: 2 });
            load();
        } else {
            showToast(result?.message || 'Hata!', 'error');
        }
    };

    const handleEdit = async () => {
        const result = await updateEmployee(editForm);
        if (result?.success) {
            showToast('Personel güncellendi.', 'success');
            setShowEditModal(false);
            load();
        } else {
            showToast(result?.message || 'Hata!', 'error');
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`${name} devre dışı bırakılacak. Emin misiniz?`)) return;
        const result = await deleteEmployee(id);
        if (result?.success) {
            showToast('Personel devre dışı bırakıldı.', 'success');
            load();
        } else {
            showToast(result?.message || 'Hata!', 'error');
        }
    };

    const openEdit = (emp: any) => {
        setEditTarget(emp);
        setEditForm({ Id: emp.Id, FullName: emp.FullName, Role: emp.Role, Password: '', IsActive: emp.IsActive });
        setShowEditModal(true);
    };

    const tabs = [
        { key: 'list', label: 'Personeller', icon: <UserCog size={14} />, count: employees.length },
        { key: 'log', label: 'Aktivite Günlüğü', icon: <Activity size={14} />, count: activityLog.length },
    ];

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Personel Yönetimi</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                        Personel ekle, düzenle ve aktivite takibi
                    </p>
                </div>
                <Button icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>Yeni Personel</Button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {activeTab === 'list' && (
                <Card noPadding>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>Personel</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Kullanıcı Adı</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Rol</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Durum</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Son Giriş</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.Id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700 }}>
                                                {emp.FullName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{emp.FullName}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>@{emp.Username}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                        <Badge variant={roleColors[emp.Role] as any}>{roleLabels[emp.Role]}</Badge>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                        <Badge variant={emp.IsActive ? 'success' : 'neutral'}>{emp.IsActive ? 'Aktif' : 'Pasif'}</Badge>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.LastLoginAt}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                            <Button size="sm" variant="ghost" icon={<Edit size={14} />} onClick={() => openEdit(emp)} />
                                            <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => handleDelete(emp.Id, emp.FullName)} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {activeTab === 'log' && (
                <Card noPadding>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>Tarih</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Personel</th>
                                <th style={{ padding: '0.75rem 1rem' }}>İşlem</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Detay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activityLog.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <Activity size={28} style={{ opacity: 0.15, display: 'block', margin: '0 auto 0.5rem' }} />
                                    Henüz aktivite kaydı yok
                                </td></tr>
                            ) : activityLog.map(log => (
                                <tr key={log.Id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{log.CreatedAt}</td>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{log.EmployeeName}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <Badge variant={log.Action === 'LOGIN' ? 'success' : log.Action === 'LOGOUT' ? 'neutral' : 'warning'}>
                                            {log.Action}
                                        </Badge>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{log.Detail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* Personel Ekle Modalı */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Yeni Personel Ekle" size="sm"
                footer={<><Button variant="outline" onClick={() => setShowAddModal(false)}>İptal</Button><Button icon={<Plus size={16} />} onClick={handleAdd}>Ekle</Button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <Input label="Ad Soyad" value={form.FullName} onChange={e => setForm({ ...form, FullName: e.target.value })} placeholder="Örn: Mehmet Kaya" />
                    <Input label="Kullanıcı Adı" value={form.Username} onChange={e => setForm({ ...form, Username: e.target.value })} placeholder="Örn: kasiyer1" />
                    <Input label="Şifre" type="password" value={form.Password} onChange={e => setForm({ ...form, Password: e.target.value })} placeholder="En az 4 karakter" />
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Rol</label>
                        <select value={form.Role} onChange={e => setForm({ ...form, Role: parseInt(e.target.value) })}
                            style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--bg-body)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '0.875rem', fontFamily: 'inherit' }}>
                            <option value={0}>Yönetici (Admin)</option>
                            <option value={1}>Müdür (Manager)</option>
                            <option value={2}>Kasiyer (Cashier)</option>
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Personel Düzenle Modalı */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Düzenle: ${editTarget?.FullName}`} size="sm"
                footer={<><Button variant="outline" onClick={() => setShowEditModal(false)}>İptal</Button><Button onClick={handleEdit}>Kaydet</Button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <Input label="Ad Soyad" value={editForm.FullName} onChange={e => setEditForm({ ...editForm, FullName: e.target.value })} />
                    <Input label="Yeni Şifre (boş bırakılırsa değişmez)" type="password" value={editForm.Password} onChange={e => setEditForm({ ...editForm, Password: e.target.value })} placeholder="İstege bağlı" />
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Rol</label>
                        <select value={editForm.Role} onChange={e => setEditForm({ ...editForm, Role: parseInt(e.target.value) })}
                            style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--bg-body)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '0.875rem', fontFamily: 'inherit' }}>
                            <option value={0}>Yönetici</option>
                            <option value={1}>Müdür</option>
                            <option value={2}>Kasiyer</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={editForm.IsActive} onChange={e => setEditForm({ ...editForm, IsActive: e.target.checked })} id="active-check" />
                        <label htmlFor="active-check" style={{ fontSize: '0.8125rem' }}>Aktif</label>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
