"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Search, ShoppingCart, CreditCard, Banknote, Trash2, Plus, Minus, Tag, Receipt, CheckCircle2, User, Star, Printer, Calculator } from 'lucide-react';
import styles from './pos.module.css';
import { getProducts, getCategories, getCustomers, processSale, getProductByBarcode } from '@/lib/api';

interface Product {
    Id: number; Name: string; Barcode: string; SalePrice: number;
    StockQuantity: number; Category?: { Name: string }; CategoryName?: string;
}

interface CartItem extends Product { Qty: number; }

interface Customer { Id: number; FullName: string; PhoneNumber?: string; DebtBalance: number; }

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [processing, setProcessing] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerPicker, setShowCustomerPicker] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCashModal, setShowCashModal] = useState(false);
    const [cashTendered, setCashTendered] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        loadProducts();
        getCategories().then(data => setCategories(data));
        getCustomers().then(data => setCustomers(data));
    }, []);

    const loadProducts = () => { getProducts().then(data => setProducts(data)); };

    // Klavye kısayolları
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'F1') { e.preventDefault(); openCashModal(); }
            if (e.key === 'F2') { e.preventDefault(); handleCheckout(1); }
            if (e.key === 'F3') { e.preventDefault(); handleCheckout(2); }
            if (e.key === 'Escape') { setCart([]); setDiscount(0); setSelectedCustomer(null); showToast('Sepet temizlendi', 'info'); }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [cart, selectedCustomer]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p.Id === product.Id);
            if (existing) {
                if (existing.Qty >= product.StockQuantity) {
                    showToast(`${product.Name} stok yetersiz!`, 'warning');
                    return prev;
                }
                return prev.map(p => p.Id === product.Id ? { ...p, Qty: p.Qty + 1 } : p);
            }
            return [...prev, { ...product, Qty: 1 }];
        });
    };

    const changeQty = (id: number, delta: number) => {
        setCart(prev => prev.map(p => {
            if (p.Id !== id) return p;
            const newQty = p.Qty + delta;
            if (newQty <= 0) return p;
            if (newQty > p.StockQuantity) { showToast('Stok yetersiz!', 'warning'); return p; }
            return { ...p, Qty: newQty };
        }));
    };

    const removeFromCart = (id: number) => setCart(prev => prev.filter(p => p.Id !== id));

    const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            const product = await getProductByBarcode(searchTerm.trim());
            if (product) { addToCart(product); setSearchTerm(""); showToast(`${product.Name} eklendi`, 'success'); }
            else showToast('Ürün bulunamadı', 'warning');
        }
    };

    const getCatName = (p: Product) => p.CategoryName || p.Category?.Name || 'Genel';

    const filteredProducts = products.filter(p => {
        const matchSearch = p.Name.toLowerCase().includes(searchTerm.toLowerCase()) || p.Barcode?.includes(searchTerm);
        const matchCategory = categoryFilter === 'all' || getCatName(p) === categoryFilter;
        return matchSearch && matchCategory;
    });

    const subtotal = cart.reduce((sum, item) => sum + (item.SalePrice * item.Qty), 0);
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * 0.18;
    const totalAmount = afterDiscount;
    const totalItems = cart.reduce((s, i) => s + i.Qty, 0);

    const handleCheckout = async (paymentMethod: number) => {
        if (cart.length === 0) { showToast('Sepet boş!', 'warning'); return; }
        if (paymentMethod === 2 && !selectedCustomer) {
            showToast('Veresiye için müşteri seçmelisiniz!', 'warning');
            setShowCustomerPicker(true);
            return;
        }
        setProcessing(true);

        const saleData: any = {
            TotalAmount: totalAmount, TaxAmount: taxAmount, PaymentMethod: paymentMethod,
            Items: cart.map(i => ({ ProductId: i.Id, Quantity: i.Qty, UnitPrice: i.SalePrice }))
        };
        if (selectedCustomer) saleData.CustomerId = selectedCustomer.Id;

        const result = await processSale(saleData);
        if (result?.success) {
            const payLabels: Record<number, string> = { 0: 'Nakit', 1: 'Kredi Kartı', 2: 'Veresiye' };
            setLastSale({
                items: [...cart], subtotal, discount, discountAmount, taxAmount,
                total: totalAmount, paymentMethod: payLabels[paymentMethod],
                customer: selectedCustomer?.FullName || null,
                date: new Date().toLocaleString('tr-TR'),
            });
            setShowReceipt(true);
            setCart([]); setDiscount(0); setSelectedCustomer(null);
            loadProducts();
            getCustomers().then(data => setCustomers(data));
            showToast(`Satış başarılı! ₺${totalAmount.toFixed(2)}`, 'success');
        } else {
            showToast('Hata: ' + (result?.message || 'Satış işlenemedi'), 'error');
        }
        setProcessing(false);
    };

    // ── Para üstü hesaplayıcı ──
    const openCashModal = () => {
        if (cart.length === 0) { showToast('Sepet boş!', 'warning'); return; }
        setCashTendered('');
        setShowCashModal(true);
    };
    const cashAmount = parseFloat(cashTendered) || 0;
    const changeAmount = cashAmount - totalAmount;
    const quickAmounts = [50, 100, 200, 500].filter(a => a >= totalAmount);

    const handleCashPayment = () => {
        if (cashAmount < totalAmount) {
            showToast('Alınan tutar yetersiz!', 'warning');
            return;
        }
        setShowCashModal(false);
        handleCheckout(0);
    };

    const filteredCustomers = customers.filter(c =>
        c.FullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.PhoneNumber?.includes(customerSearch)
    );

    return (
        <div className={styles.posContainer}>
            {/* ─── SOL: ÜRÜNLER ─── */}
            <div className={styles.productSection}>
                <div className={styles.searchBar}>
                    <Input placeholder="Barkod okutun veya ürün adı yazın... (Enter)" icon={<Search size={16} />}
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleSearchKeyDown} />
                </div>

                {/* Kategori filtre */}
                <div className={styles.categoryFilter}>
                    <button className={`${styles.catBtn} ${categoryFilter === 'all' ? styles.catActive : ''}`} onClick={() => setCategoryFilter('all')}>
                        Tümü <span className={styles.catCount}>{products.length}</span>
                    </button>
                    {categories.map((cat: any) => {
                        const count = products.filter(p => getCatName(p) === (cat.Name || cat)).length;
                        return (
                            <button key={cat.Id || cat.Name || cat} className={`${styles.catBtn} ${categoryFilter === (cat.Name || cat) ? styles.catActive : ''}`}
                                onClick={() => setCategoryFilter(cat.Name || cat)}>
                                {cat.Name || cat} <span className={styles.catCount}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Ürün grid */}
                <div className={styles.productGrid}>
                    {filteredProducts.map(product => (
                        <div key={product.Id} className={styles.productCard} onClick={() => addToCart(product)}
                            style={{ opacity: product.StockQuantity === 0 ? 0.35 : 1, pointerEvents: product.StockQuantity === 0 ? 'none' : 'auto' }}>
                            <div className={styles.productCardInner}>
                                <div className={styles.productName}>{product.Name}</div>
                                <div className={styles.productCategory}>{getCatName(product)}</div>
                            </div>
                            <div className={styles.productFooter}>
                                <span className={styles.productPrice}>₺{product.SalePrice.toFixed(2)}</span>
                                <Badge variant={product.StockQuantity < 10 ? (product.StockQuantity === 0 ? 'danger' : 'warning') : 'success'}>
                                    {product.StockQuantity}
                                </Badge>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className={styles.emptyProducts}><Search size={28} style={{ opacity: 0.2 }} /><div>Ürün bulunamadı</div></div>
                    )}
                </div>
            </div>

            {/* ─── SAĞ: SEPET ─── */}
            <Card className={styles.cartSection}>
                <div className={styles.cartHeader}>
                    <h2 className={styles.cartTitle}><ShoppingCart size={18} /> Sepet</h2>
                    {totalItems > 0 && <Badge variant="info">{totalItems} ürün</Badge>}
                </div>

                {/* Müşteri seçici */}
                <div className={styles.customerBar}>
                    {selectedCustomer ? (
                        <div className={styles.customerSelected}>
                            <User size={14} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{selectedCustomer.FullName}</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Borç: ₺{selectedCustomer.DebtBalance.toFixed(2)}</div>
                            </div>
                            <button className={styles.removeBtn} onClick={() => setSelectedCustomer(null)}><Trash2 size={12} /></button>
                        </div>
                    ) : (
                        <button className={styles.customerPickBtn} onClick={() => setShowCustomerPicker(true)}>
                            <User size={14} /> Müşteri Seç (Veresiye / Puan)
                        </button>
                    )}
                </div>

                <div className={styles.cartItems}>
                    {cart.length === 0 ? (
                        <div className={styles.cartEmpty}>
                            <ShoppingCart size={36} style={{ opacity: 0.12 }} />
                            <div className={styles.cartEmptyTitle}>Sepet Boş</div>
                            <div className={styles.cartEmptyHint}>Ürünlere tıklayarak veya barkod okutarak ekleyin</div>
                        </div>
                    ) : cart.map(item => (
                        <div key={item.Id} className={styles.cartItem}>
                            <div className={styles.itemInfo}>
                                <div className={styles.itemName}>{item.Name}</div>
                                <div className={styles.itemMeta}>₺{item.SalePrice.toFixed(2)} × {item.Qty}</div>
                            </div>
                            <div className={styles.qtyGroup}>
                                <button onClick={() => changeQty(item.Id, -1)} className={styles.qtyBtn}><Minus size={12} /></button>
                                <span className={styles.qtyValue}>{item.Qty}</span>
                                <button onClick={() => changeQty(item.Id, 1)} className={styles.qtyBtn}><Plus size={12} /></button>
                            </div>
                            <div className={styles.itemTotal}>₺{(item.Qty * item.SalePrice).toFixed(2)}</div>
                            <button onClick={() => removeFromCart(item.Id)} className={styles.removeBtn}><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>

                <div className={styles.cartSummary}>
                    <div className={styles.discountRow}>
                        <Tag size={14} style={{ color: 'var(--accent-primary)' }} />
                        <input type="number" min="0" max="100" value={discount}
                            onChange={e => setDiscount(Math.min(100, parseFloat(e.target.value) || 0))}
                            className={styles.discountInput} />
                        <span className={styles.discountLabel}>% İndirim</span>
                    </div>

                    <div className={styles.summaryRow}><span>Ara Toplam</span><span>₺{subtotal.toFixed(2)}</span></div>
                    {discount > 0 && <div className={styles.summaryRow} style={{ color: 'var(--success)' }}><span>İndirim (%{discount})</span><span>-₺{discountAmount.toFixed(2)}</span></div>}
                    <div className={styles.summaryRow}><span>KDV (%18)</span><span>₺{taxAmount.toFixed(2)}</span></div>
                    <div className={styles.totalRow}><span>GENEL TOPLAM</span><span>₺{totalAmount.toFixed(2)}</span></div>

                    <div className={styles.paymentBtns}>
                        <Button variant="outline" size="lg" icon={<Banknote size={18} />} fullWidth onClick={openCashModal} isLoading={processing} disabled={cart.length === 0}>
                            NAKİT (F1)
                        </Button>
                        <Button size="lg" icon={<CreditCard size={18} />} fullWidth onClick={() => handleCheckout(1)} isLoading={processing} disabled={cart.length === 0}>
                            KART (F2)
                        </Button>
                    </div>
                    <Button variant="outline" size="lg" fullWidth icon={<Receipt size={16} />}
                        onClick={() => handleCheckout(2)} isLoading={processing}
                        disabled={cart.length === 0}
                        style={{ marginTop: '0.5rem', borderColor: selectedCustomer ? 'var(--warning)' : 'var(--border-strong)', color: selectedCustomer ? 'var(--warning)' : 'var(--text-muted)' }}>
                        VERESİYE (F3) {selectedCustomer ? `→ ${selectedCustomer.FullName}` : ''}
                    </Button>
                    <div className={styles.shortcutHint}>ESC = Sepeti Temizle</div>
                </div>
            </Card>

            {/* ─── MÜŞTERİ SEÇİCİ MODAL ─── */}
            <Modal isOpen={showCustomerPicker} onClose={() => setShowCustomerPicker(false)} title="Müşteri Seç" size="md">
                <Input placeholder="Ad veya telefon ile ara..." icon={<Search size={16} />} value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '0.75rem' }}>
                    {filteredCustomers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Müşteri bulunamadı</div>
                    ) : filteredCustomers.map(c => (
                        <div key={c.Id} onClick={() => { setSelectedCustomer(c); setShowCustomerPicker(false); setCustomerSearch(""); showToast(`${c.FullName} seçildi`, 'info'); }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.FullName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.PhoneNumber || 'Telefon yok'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600, color: c.DebtBalance > 0 ? 'var(--danger)' : 'var(--success)', fontSize: '0.8125rem' }}>₺{c.DebtBalance.toFixed(2)}</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Borç</div>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* ─── FİŞ ÖNİZLEME ─── */}
            <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} title="Satış Fişi" size="md"
                footer={<><Button variant="outline" icon={<Printer size={16} />} onClick={() => window.print()}>Yazdır</Button><Button onClick={() => setShowReceipt(false)}>Kapat</Button></>}>
                {lastSale && (
                    <div className={styles.receipt}>
                        <div className={styles.receiptHeader}>
                            <CheckCircle2 size={32} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                            <div className={styles.receiptTitle}>Satış Başarılı!</div>
                            <div className={styles.receiptDate}>{lastSale.date}</div>
                            {lastSale.customer && <div style={{ marginTop: '0.5rem' }}><Badge variant="info">Müşteri: {lastSale.customer}</Badge></div>}
                        </div>
                        <div className={styles.receiptDivider} />
                        <table className={styles.receiptTable}>
                            <thead><tr><th style={{ textAlign: 'left' }}>Ürün</th><th style={{ textAlign: 'center' }}>Adet</th><th style={{ textAlign: 'right' }}>Tutar</th></tr></thead>
                            <tbody>
                                {lastSale.items.map((item: CartItem, i: number) => (
                                    <tr key={i}><td>{item.Name}</td><td style={{ textAlign: 'center' }}>{item.Qty}</td><td style={{ textAlign: 'right' }}>₺{(item.Qty * item.SalePrice).toFixed(2)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                        <div className={styles.receiptDivider} />
                        <div className={styles.receiptSummary}>
                            <div className={styles.receiptRow}><span>Ara Toplam</span><span>₺{lastSale.subtotal.toFixed(2)}</span></div>
                            {lastSale.discount > 0 && <div className={styles.receiptRow} style={{ color: 'var(--success)' }}><span>İndirim (%{lastSale.discount})</span><span>-₺{lastSale.discountAmount.toFixed(2)}</span></div>}
                            <div className={styles.receiptRow}><span>KDV (%18)</span><span>₺{lastSale.taxAmount.toFixed(2)}</span></div>
                            <div className={styles.receiptTotal}><span>TOPLAM</span><span>₺{lastSale.total.toFixed(2)}</span></div>
                        </div>
                        <div className={styles.receiptPayment}><Badge variant="info">{lastSale.paymentMethod}</Badge></div>
                    </div>
                )}
            </Modal>

            {/* ─── NAKİT ÖDEME MODALI ─── */}
            <Modal isOpen={showCashModal} onClose={() => setShowCashModal(false)} title="Nakit Ödeme" size="sm"
                footer={<><Button variant="outline" onClick={() => setShowCashModal(false)}>İptal</Button>
                    <Button icon={<Banknote size={16} />} onClick={handleCashPayment} disabled={cashAmount < totalAmount}>Ödemeyi Tamamla</Button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>TOPLAM TUTAR</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>₺{totalAmount.toFixed(2)}</div>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                            <Calculator size={12} style={{ verticalAlign: '-2px' }} /> Alınan Tutar (₺)
                        </label>
                        <input type="number" value={cashTendered} onChange={e => setCashTendered(e.target.value)}
                            placeholder="0.00" autoFocus min={0} step="0.01"
                            style={{
                                width: '100%', padding: '0.75rem', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center',
                                background: 'var(--bg-body)', border: '2px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-main)', fontFamily: 'inherit', outline: 'none'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'} />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {quickAmounts.map(amt => (
                            <button key={amt} onClick={() => setCashTendered(String(amt))}
                                style={{
                                    flex: 1, minWidth: '60px', padding: '0.5rem', background: 'var(--bg-body)', border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600,
                                    color: 'var(--text-main)', transition: 'background 0.1s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-body)'}>
                                ₺{amt}
                            </button>
                        ))}
                        <button onClick={() => setCashTendered(totalAmount.toFixed(2))}
                            style={{
                                flex: 1, minWidth: '60px', padding: '0.5rem', background: 'var(--accent-primary)', border: 'none',
                                borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600,
                                color: '#fff'
                            }}>
                            Tam Tutar
                        </button>
                    </div>

                    {cashAmount > 0 && (
                        <div style={{
                            textAlign: 'center', padding: '1rem', borderRadius: 'var(--radius-sm)',
                            background: changeAmount >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                            border: `1px solid ${changeAmount >= 0 ? 'var(--success)' : 'var(--danger)'}`
                        }}>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                {changeAmount >= 0 ? 'PARA ÜSTÜ' : 'EKSİK TUTAR'}
                            </div>
                            <div style={{
                                fontSize: '1.75rem', fontWeight: 800,
                                color: changeAmount >= 0 ? 'var(--success)' : 'var(--danger)'
                            }}>
                                ₺{Math.abs(changeAmount).toFixed(2)}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
