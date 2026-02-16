"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Save, Printer, Database, AlertTriangle, Shield, Store } from 'lucide-react';
import styles from '../dashboard.module.css';
import { getSettings, saveSettings, backupDatabase, resetDatabase } from '@/lib/api';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        StoreName: '', Address: '', TaxNumber: '', Phone: '', TaxRate: 18, AutoPrint: true, DefaultPrinter: 'Microsoft Print to PDF'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        getSettings().then(data => {
            if (data && Object.keys(data).length > 0) setSettings(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const result = await saveSettings(settings);
        if (result?.success) {
            showToast('Ayarlar kaydedildi', 'success');
        } else {
            showToast(result?.message || 'Kaydetme başarısız', 'error');
        }
        setSaving(false);
    };

    const handleBackup = async () => {
        const result = await backupDatabase();
        if (result?.success) {
            showToast(result.message || 'Yedek oluşturuldu', 'success');
        } else {
            showToast(result?.message || 'Yedekleme başarısız', 'error');
        }
    };

    const handleReset = async () => {
        const result = await resetDatabase();
        if (result?.success) {
            showToast(result.message || 'Veritabanı sıfırlandı', 'success');
            setShowResetModal(false);
        } else {
            showToast(result?.message || 'Sıfırlama başarısız', 'error');
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Yükleniyor...</div>;

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>Ayarlar</h1>
                    <p className={styles.subtitle}>Sistem yapılandırması ve donanım ayarları</p>
                </div>
                <Button icon={<Save size={16} />} onClick={handleSave} isLoading={saving}>Değişiklikleri Kaydet</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Store Info */}
                <Card>
                    <h3 style={{ fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Store size={18} /> Mağaza Bilgileri
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Input label="Mağaza Adı" value={settings.StoreName} onChange={e => setSettings({ ...settings, StoreName: e.target.value })} />
                        <Input label="Adres" value={settings.Address} onChange={e => setSettings({ ...settings, Address: e.target.value })} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input label="Vergi No" value={settings.TaxNumber} onChange={e => setSettings({ ...settings, TaxNumber: e.target.value })} />
                            <Input label="Telefon" value={settings.Phone} onChange={e => setSettings({ ...settings, Phone: e.target.value })} />
                        </div>
                        <Input label="KDV Oranı (%)" type="number" value={settings.TaxRate} onChange={e => setSettings({ ...settings, TaxRate: parseInt(e.target.value) || 0 })} />
                    </div>
                </Card>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Printer */}
                    <Card>
                        <h3 style={{ fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Printer size={18} /> Yazıcı Ayarları
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Varsayılan Yazıcı: </span>
                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{settings.DefaultPrinter}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" id="autoPrint" checked={settings.AutoPrint} onChange={e => setSettings({ ...settings, AutoPrint: e.target.checked })}
                                    style={{ accentColor: 'var(--accent-primary)' }} />
                                <label htmlFor="autoPrint" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Satış sonrası otomatik fiş yazdır</label>
                            </div>
                        </div>
                    </Card>

                    {/* Database */}
                    <Card>
                        <h3 style={{ fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Database size={18} /> Veritabanı Yönetimi
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <Button variant="outline" onClick={handleBackup} icon={<Shield size={16} />} fullWidth>
                                Veritabanını Yedekle
                            </Button>
                            <Button variant="danger" onClick={() => setShowResetModal(true)} icon={<AlertTriangle size={16} />} fullWidth>
                                Fabrika Ayarlarına Sıfırla
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Reset Confirmation */}
            <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Veritabanını Sıfırla" size="sm"
                footer={<><Button variant="outline" onClick={() => setShowResetModal(false)}>İptal</Button><Button variant="danger" onClick={handleReset} icon={<AlertTriangle size={16} />}>Sıfırla</Button></>}>
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <AlertTriangle size={40} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Bu işlem tüm verileri silecek!</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Mevcut veriler otomatik olarak yedeklenecek. Uygulama yeniden başlatıldığında varsayılan veriler oluşturulacak.</p>
                </div>
            </Modal>
        </div>
    );
}
