"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { SkeletonTable, Skeleton } from '@/components/ui/Skeleton';
import { PageTransition } from '@/components/ui/PageTransition';
import styles from '../dashboard.module.css';
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories } from '@/lib/api';

interface Product {
    Id: number;
    Barcode: string;
    Name: string;
    Description?: string;
    SalePrice: number;
    PurchasePrice: number;
    StockQuantity: number;
    CriticalStockLevel: number;
    CategoryId?: number;
    Category?: { Name: string };
}

const emptyProduct = {
    Barcode: '', Name: '', Description: '', SalePrice: 0, PurchasePrice: 0,
    StockQuantity: 0, CriticalStockLevel: 10, CategoryId: 1
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formData, setFormData] = useState<any>(emptyProduct);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadProducts();
        getCategories().then(c => setCategories(c));
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
    };

    const filteredProducts = products.filter(p => {
        const matchSearch = p.Name.toLowerCase().includes(searchTerm.toLowerCase()) || p.Barcode.includes(searchTerm);
        const matchCategory = !categoryFilter || (p.CategoryId?.toString() === categoryFilter);
        return matchSearch && matchCategory;
    });

    const handleAdd = async () => {
        setSaving(true);
        try {
            const success = await addProduct(formData);
            if (success) {
                showToast('Ürün başarıyla eklendi', 'success');
                setShowAddModal(false);
                setFormData(emptyProduct);
                await loadProducts();
            } else {
                showToast('Ürün eklenirken hata oluştu', 'error');
            }
        } catch (e: any) {
            showToast(e?.message || 'Hata oluştu', 'error');
        }
        setSaving(false);
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            Id: product.Id, Barcode: product.Barcode, Name: product.Name,
            Description: product.Description || '', SalePrice: product.SalePrice,
            PurchasePrice: product.PurchasePrice, StockQuantity: product.StockQuantity,
            CriticalStockLevel: product.CriticalStockLevel, CategoryId: product.CategoryId || 1
        });
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        setSaving(true);
        const result = await updateProduct(formData);
        if (result?.success) {
            showToast('Ürün güncellendi', 'success');
            setShowEditModal(false);
            await loadProducts();
        } else {
            showToast(result?.message || 'Güncelleme başarısız', 'error');
        }
        setSaving(false);
    };

    const handleDeleteConfirm = (product: Product) => {
        setSelectedProduct(product);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!selectedProduct) return;
        const success = await deleteProduct(selectedProduct.Id);
        if (success) {
            showToast('Ürün silindi', 'success');
            setShowDeleteModal(false);
            await loadProducts();
        } else {
            showToast('Silme işlemi başarısız', 'error');
        }
    };

    const getStockBadge = (qty: number, critical: number) => {
        if (qty === 0) return <Badge variant="danger">Tükendi</Badge>;
        if (qty <= critical) return <Badge variant="warning">Kritik ({qty})</Badge>;
        return <Badge variant="success">{qty}</Badge>;
    };

    const categoryOptions = categories.map((c: any) => ({ value: c.Id, label: c.Name }));

    const productFormJSX = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input label="Barkod *" value={formData.Barcode} onChange={e => setFormData({ ...formData, Barcode: e.target.value })} placeholder="Barkod numarası" />
                <Input label="Ürün Adı *" value={formData.Name} onChange={e => setFormData({ ...formData, Name: e.target.value })} placeholder="Ürün adı" />
            </div>
            <Input label="Açıklama" value={formData.Description} onChange={e => setFormData({ ...formData, Description: e.target.value })} placeholder="İsteğe bağlı açıklama" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <Input label="Alış Fiyatı (₺)" type="number" value={formData.PurchasePrice} onChange={e => setFormData({ ...formData, PurchasePrice: parseFloat(e.target.value) || 0 })} />
                <Input label="Satış Fiyatı (₺) *" type="number" value={formData.SalePrice} onChange={e => setFormData({ ...formData, SalePrice: parseFloat(e.target.value) || 0 })} />
                <Select label="Kategori" options={categoryOptions} value={formData.CategoryId} onChange={e => setFormData({ ...formData, CategoryId: parseInt(e.target.value) })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input label="Stok Miktarı" type="number" value={formData.StockQuantity} onChange={e => setFormData({ ...formData, StockQuantity: parseInt(e.target.value) || 0 })} />
                <Input label="Kritik Stok Seviyesi" type="number" value={formData.CriticalStockLevel} onChange={e => setFormData({ ...formData, CriticalStockLevel: parseInt(e.target.value) || 0 })} />
            </div>
        </div>
    );

    if (loading) {
        return (
            <div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <Skeleton width="180px" height="24px" />
                    <Skeleton width="240px" height="12px" className="mt" />
                </div>
                <SkeletonTable rows={8} />
            </div>
        );
    }

    return (
        <PageTransition>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>Ürün Yönetimi</h1>
                    <p className={styles.subtitle}>Envanter durumu ve fiyatlandırma — {products.length} ürün</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={() => { setFormData(emptyProduct); setShowAddModal(true); }}>Yeni Ürün Ekle</Button>
            </div>

            <Card noPadding>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <Input placeholder="Barkod veya Ürün Adı ile ara..." icon={<Search size={16} />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ maxWidth: '400px', flex: 1 }} />
                    <Select options={[{ value: '', label: 'Tüm Kategoriler' }, ...categoryOptions]} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: '180px' }} />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>Barkod</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Ürün Adı</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Kategori</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Alış</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Satış</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Kâr %</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Stok</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Yükleniyor...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Ürün bulunamadı.</td></tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.Id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{product.Barcode}</td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                                            {product.Name}
                                            {product.Description && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{product.Description}</div>}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <Badge variant="info">{product.Category?.Name || 'Genel'}</Badge>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>₺{product.PurchasePrice?.toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>₺{product.SalePrice.toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            {(() => { const p = product.PurchasePrice > 0 ? ((product.SalePrice - product.PurchasePrice) / product.PurchasePrice * 100) : 0; return <Badge variant={p > 20 ? 'success' : p > 0 ? 'warning' : 'neutral'}>%{p.toFixed(1)}</Badge>; })()}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            {getStockBadge(product.StockQuantity, product.CriticalStockLevel)}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                                <Button variant="ghost" size="sm" icon={<Edit size={14} />} onClick={() => handleEdit(product)} />
                                                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} style={{ color: 'var(--danger)' }} onClick={() => handleDeleteConfirm(product)} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Yeni Ürün Ekle" size="lg"
                footer={<>
                    <Button variant="outline" onClick={() => setShowAddModal(false)}>İptal</Button>
                    <Button onClick={handleAdd} isLoading={saving} icon={<Plus size={16} />}>Ürün Ekle</Button>
                </>}>
                {productFormJSX}
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Düzenle: ${selectedProduct?.Name}`} size="lg"
                footer={<>
                    <Button variant="outline" onClick={() => setShowEditModal(false)}>İptal</Button>
                    <Button onClick={handleUpdate} isLoading={saving} icon={<Edit size={16} />}>Güncelle</Button>
                </>}>
                {productFormJSX}
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Ürün Sil" size="sm"
                footer={<>
                    <Button variant="outline" onClick={() => setShowDeleteModal(false)}>İptal</Button>
                    <Button variant="danger" onClick={handleDelete} icon={<Trash2 size={16} />}>Sil</Button>
                </>}>
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <Package size={40} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
                    <p style={{ marginBottom: '0.5rem' }}><strong>{selectedProduct?.Name}</strong> ürününü silmek istediğinize emin misiniz?</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Bu işlem geri alınamaz.</p>
                </div>
            </Modal>
        </PageTransition>
    );
}
