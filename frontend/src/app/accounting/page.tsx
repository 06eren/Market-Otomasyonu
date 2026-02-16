"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';
import {
    Calculator, TrendingUp, TrendingDown, Wallet, Users, Banknote, Landmark, Receipt,
    Plus, Trash2, DollarSign, FileText, Calendar, CreditCard, CheckCircle, Clock
} from 'lucide-react';
import styles from './accounting.module.css';
import { SkeletonKPI, SkeletonChart, SkeletonTable } from '@/components/ui/Skeleton';
import { PageTransition } from '@/components/ui/PageTransition';
import {
    addExpense, getExpenses, deleteExpense, getExpenseSummary,
    getPendingSalaries, paySalary, payAllSalaries, getSalaryHistory,
    getTaxSummary, getProfitLoss, getMonthlySummary,
    getDebtPaymentHistory, getCustomers
} from '@/lib/api';
import eventBus from '@/lib/eventBus';

const EXPENSE_CATEGORIES = [
    { value: 0, label: 'Kira', icon: '🏠' },
    { value: 1, label: 'Elektrik', icon: '⚡' },
    { value: 2, label: 'Su', icon: '💧' },
    { value: 3, label: 'Doğalgaz', icon: '🔥' },
    { value: 4, label: 'İnternet', icon: '🌐' },
    { value: 5, label: 'Maaş', icon: '👤' },
    { value: 6, label: 'Tedarikçi', icon: '📦' },
    { value: 7, label: 'Vergi', icon: '🏛️' },
    { value: 8, label: 'Sigorta', icon: '🛡️' },
    { value: 9, label: 'Bakım', icon: '🔧' },
    { value: 10, label: 'Nakliye', icon: '🚚' },
    { value: 11, label: 'Diğer', icon: '📋' },
];

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function fmt(n: number) { return `₺${(n || 0).toFixed(2)}`; }
function fmtK(n: number) { return n >= 1000 ? `₺${(n / 1000).toFixed(1)}K` : fmt(n); }

function getDateRange(period: string) {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    switch (period) {
        case 'thisMonth': return { start: new Date(y, m, 1), end: now };
        case 'lastMonth': return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) };
        case 'thisYear': return { start: new Date(y, 0, 1), end: now };
        default: return { start: new Date(y, m, 1), end: now };
    }
}

function toIso(d: Date) { return d.toISOString().split('T')[0]; }

export default function AccountingPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // Overview state
    const [monthly, setMonthly] = useState<any[]>([]);
    const [plData, setPlData] = useState<any>({});

    // Expense state
    const [expenses, setExpenses] = useState<any[]>([]);
    const [expenseSummary, setExpenseSummary] = useState<any>({});
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ Description: '', Amount: '', Category: 0, Date: toIso(new Date()), Notes: '', IsRecurring: false });
    const [expensePeriod, setExpensePeriod] = useState('thisMonth');
    const [saving, setSaving] = useState(false);

    // Salary state
    const [pendingSalaries, setPendingSalaries] = useState<any[]>([]);
    const [salaryHistory, setSalaryHistory] = useState<any[]>([]);

    // Tax state
    const [taxData, setTaxData] = useState<any>({});

    // PL state
    const [plPeriod, setPlPeriod] = useState('thisMonth');

    // Debt state
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerDebt, setSelectedCustomerDebt] = useState<any>(null);
    const [debtHistory, setDebtHistory] = useState<any[]>([]);

    const year = new Date().getFullYear();

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        await Promise.all([
            loadOverview(),
            loadExpenses(),
            loadSalaries(),
            loadTax(),
            loadPL(),
            loadDebt()
        ]);
        setLoading(false);
    };

    const loadOverview = async () => {
        const m = await getMonthlySummary(year);
        setMonthly(m);
    };

    const loadExpenses = async () => {
        const { start, end } = getDateRange(expensePeriod);
        const [exp, sum] = await Promise.all([
            getExpenses(toIso(start), toIso(end)),
            getExpenseSummary(toIso(start), toIso(end))
        ]);
        setExpenses(exp);
        setExpenseSummary(sum);
    };

    const loadSalaries = async () => {
        const [pending, hist] = await Promise.all([getPendingSalaries(), getSalaryHistory()]);
        setPendingSalaries(pending);
        setSalaryHistory(hist);
    };

    const loadTax = async () => {
        const data = await getTaxSummary(year);
        setTaxData(data);
    };

    const loadPL = async () => {
        const { start, end } = getDateRange(plPeriod);
        const pl = await getProfitLoss(toIso(start), toIso(end));
        setPlData(pl);
    };

    const loadDebt = async () => {
        const c = await getCustomers();
        setCustomers(c.filter((x: any) => (x.DebtBalance || 0) > 0));
    };

    // Effects for period changes
    useEffect(() => { loadExpenses(); }, [expensePeriod]);
    useEffect(() => { loadPL(); }, [plPeriod]);

    // ── Handlers ──

    const handleAddExpense = async () => {
        const amount = parseFloat(expenseForm.Amount);
        if (!expenseForm.Description || !amount || amount <= 0) {
            showToast('Açıklama ve tutar gerekli', 'warning'); return;
        }
        setSaving(true);
        const result = await addExpense({ ...expenseForm, Amount: amount });
        if (result?.success) {
            showToast('Gider eklendi', 'success');
            setShowExpenseModal(false);
            setExpenseForm({ Description: '', Amount: '', Category: 0, Date: toIso(new Date()), Notes: '', IsRecurring: false });
            eventBus.emit('expense-change');
            await Promise.all([loadExpenses(), loadOverview(), loadPL()]);
        } else {
            showToast(result?.message || 'Hata', 'error');
        }
        setSaving(false);
    };

    const handleDeleteExpense = async (id: number) => {
        const result = await deleteExpense(id);
        if (result?.success) {
            showToast('Gider silindi', 'success');
            await Promise.all([loadExpenses(), loadOverview(), loadPL()]);
        }
    };

    const handlePaySalary = async (employeeId: number) => {
        setSaving(true);
        const result = await paySalary({ EmployeeId: employeeId });
        if (result?.success) {
            showToast(result.message, 'success');
            await Promise.all([loadSalaries(), loadExpenses(), loadOverview()]);
        } else {
            showToast(result?.message || 'Hata', 'error');
        }
        setSaving(false);
    };

    const handlePayAllSalaries = async () => {
        setSaving(true);
        const result = await payAllSalaries();
        if (result?.success) {
            showToast(result.message, 'success');
            await Promise.all([loadSalaries(), loadExpenses(), loadOverview()]);
        } else {
            showToast(result?.message || 'Hata', 'error');
        }
        setSaving(false);
    };

    const handleViewDebtHistory = async (customer: any) => {
        setSelectedCustomerDebt(customer);
        const h = await getDebtPaymentHistory(customer.Id);
        setDebtHistory(h);
    };

    // ── Computed ──
    const totalMonthlyRevenue = monthly.reduce((s, m) => s + (m.Revenue || 0), 0);
    const totalMonthlyExpenses = monthly.reduce((s, m) => s + (m.Expenses || 0), 0);
    const currentMonthData = monthly.find(m => m.Month === new Date().getMonth() + 1) || {};
    const unpaidCount = pendingSalaries.filter(s => !s.IsPaid).length;
    const totalDebt = customers.reduce((s, c) => s + (c.DebtBalance || 0), 0);
    const maxMonthly = Math.max(...monthly.map(m => Math.max(m.Revenue || 0, m.Expenses || 0)), 1);

    const tabs = [
        { key: 'overview', label: 'Genel Bakış', icon: <Calculator size={14} /> },
        { key: 'expenses', label: 'Gelir/Gider', icon: <Receipt size={14} />, count: expenses.length },
        { key: 'salary', label: 'Personel Maaş', icon: <Users size={14} />, count: unpaidCount || undefined },
        { key: 'tax', label: 'Vergi Takibi', icon: <Landmark size={14} /> },
        { key: 'profitloss', label: 'Kâr/Zarar', icon: <TrendingUp size={14} /> },
    ];

    if (loading) {
        return (
            <div>
                <SkeletonKPI count={5} />
                <div style={{ marginTop: '1.5rem' }}><SkeletonChart /></div>
                <div style={{ marginTop: '1.5rem' }}><SkeletonTable rows={5} /></div>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>Muhasebe</h1>
                    <p className={styles.subtitle}>Gelir, gider, maaş, vergi ve kâr/zarar yönetimi — {year}</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={() => setShowExpenseModal(true)}>Gider Ekle</Button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {/* ════════════════ GENEL BAKIŞ ════════════════ */}
            {activeTab === 'overview' && (
                <>
                    <div className={`${styles.kpiGrid} stagger`}>
                        <div className={styles.kpiCard} style={{ borderLeft: '3px solid var(--success)' }}>
                            <div className={styles.kpiIcon} style={{ background: 'var(--success-bg)' }}>
                                <TrendingUp size={18} style={{ color: 'var(--success)' }} />
                            </div>
                            <div>
                                <div className={styles.kpiLabel}>Bu Ay Gelir</div>
                                <div className={styles.kpiValue} style={{ color: 'var(--success)' }}>{fmt(currentMonthData.Revenue || 0)}</div>
                            </div>
                        </div>
                        <div className={styles.kpiCard} style={{ borderLeft: '3px solid var(--danger)' }}>
                            <div className={styles.kpiIcon} style={{ background: 'var(--danger-bg)' }}>
                                <TrendingDown size={18} style={{ color: 'var(--danger)' }} />
                            </div>
                            <div>
                                <div className={styles.kpiLabel}>Bu Ay Gider</div>
                                <div className={styles.kpiValue} style={{ color: 'var(--danger)' }}>{fmt(currentMonthData.Expenses || 0)}</div>
                            </div>
                        </div>
                        <div className={styles.kpiCard} style={{ borderLeft: `3px solid ${(currentMonthData.Profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
                            <div className={styles.kpiIcon} style={{ background: 'var(--accent-subtle)' }}>
                                <DollarSign size={18} style={{ color: 'var(--accent-primary)' }} />
                            </div>
                            <div>
                                <div className={styles.kpiLabel}>Net Kâr</div>
                                <div className={styles.kpiValue}>{fmt(currentMonthData.Profit || 0)}</div>
                            </div>
                        </div>
                        <div className={styles.kpiCard} style={{ borderLeft: '3px solid var(--warning)' }}>
                            <div className={styles.kpiIcon} style={{ background: 'var(--warning-bg)' }}>
                                <Wallet size={18} style={{ color: 'var(--warning)' }} />
                            </div>
                            <div>
                                <div className={styles.kpiLabel}>Toplam Alacak</div>
                                <div className={styles.kpiValue}>{fmt(totalDebt)}</div>
                            </div>
                        </div>
                        <div className={styles.kpiCard} style={{ borderLeft: '3px solid var(--accent-primary)' }}>
                            <div className={styles.kpiIcon} style={{ background: 'var(--accent-subtle)' }}>
                                <Users size={18} style={{ color: 'var(--accent-primary)' }} />
                            </div>
                            <div>
                                <div className={styles.kpiLabel}>Ödenmemiş Maaş</div>
                                <div className={styles.kpiValue}>{unpaidCount} kişi</div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly bar chart */}
                    <Card>
                        <h3 className={styles.sectionTitle}><Calendar size={16} /> {year} Aylık Gelir vs Gider</h3>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.6875rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, background: 'var(--success)', borderRadius: 2, display: 'inline-block' }} /> Gelir</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, background: 'var(--danger)', borderRadius: 2, display: 'inline-block', opacity: 0.7 }} /> Gider</span>
                        </div>
                        <div className={styles.monthBar}>
                            {MONTHS.map((label, i) => {
                                const m = monthly.find(x => x.Month === i + 1) || {};
                                const rH = maxMonthly > 0 ? ((m.Revenue || 0) / maxMonthly) * 90 : 0;
                                const eH = maxMonthly > 0 ? ((m.Expenses || 0) / maxMonthly) * 90 : 0;
                                return (
                                    <div key={i} className={styles.monthCol} title={`${label}: Gelir ${fmt(m.Revenue || 0)}, Gider ${fmt(m.Expenses || 0)}`}>
                                        <div className={styles.barIncome} style={{ height: `${rH}%` }} />
                                        <div className={styles.barExpense} style={{ height: `${eH}%` }} />
                                        <span className={styles.monthLabel}>{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>YILLIK GELİR</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--success)' }}>{fmtK(totalMonthlyRevenue)}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>YILLIK GİDER</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--danger)' }}>{fmtK(totalMonthlyExpenses)}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>YILLIK KÂR</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{fmtK(totalMonthlyRevenue - totalMonthlyExpenses)}</div>
                            </div>
                        </div>
                    </Card>
                </>
            )}

            {/* ════════════════ GELİR/GİDER ════════════════ */}
            {activeTab === 'expenses' && (
                <>
                    {/* Period selector */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        {[
                            { key: 'thisMonth', label: 'Bu Ay' },
                            { key: 'lastMonth', label: 'Geçen Ay' },
                            { key: 'thisYear', label: 'Bu Yıl' }
                        ].map(p => (
                            <Button key={p.key} variant={expensePeriod === p.key ? 'primary' : 'outline'} size="sm" onClick={() => setExpensePeriod(p.key)}>{p.label}</Button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {/* Category distribution */}
                        <Card>
                            <h3 className={styles.sectionTitle}><Receipt size={16} /> Kategori Dağılımı</h3>
                            {(expenseSummary.ByCategory || []).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Bu dönemde gider kaydı yok</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {(expenseSummary.ByCategory || []).map((c: any, i: number) => {
                                        const maxVal = Math.max(...(expenseSummary.ByCategory || []).map((x: any) => x.Total));
                                        const cat = EXPENSE_CATEGORIES.find(ec => ec.label === c.CategoryName || ec.value === c.Category);
                                        const colors: Array<'accent' | 'success' | 'warning' | 'danger'> = ['danger', 'warning', 'accent', 'success'];
                                        return (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                    <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{cat?.icon} {cat?.label || c.CategoryName}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.Count} kayıt — {fmt(c.Total)}</span>
                                                </div>
                                                <ProgressBar value={c.Total} max={maxVal} color={colors[i % colors.length]} size="md" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>TOPLAM GİDER</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>{fmt(expenseSummary.TotalExpenses || 0)}</div>
                            </div>
                        </Card>

                        {/* Expense list */}
                        <Card noPadding>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>Son Giderler</h3>
                                <Badge variant="danger">{expenses.length} kayıt</Badge>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {expenses.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Gider bulunamadı</div>
                                ) : expenses.map((e: any) => {
                                    const cat = EXPENSE_CATEGORIES.find(c => c.value === e.Category);
                                    return (
                                        <div key={e.Id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{ fontSize: '1.25rem' }}>{cat?.icon || '📋'}</span>
                                                <div>
                                                    <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{e.Description}</div>
                                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{cat?.label} · {e.Date}{e.IsRecurring ? ' · 🔄' : ''}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.875rem' }}>-{fmt(e.Amount)}</span>
                                                <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} style={{ color: 'var(--danger)' }} onClick={() => handleDeleteExpense(e.Id)} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                </>
            )}

            {/* ════════════════ PERSONEL MAAŞ ════════════════ */}
            {activeTab === 'salary' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: 600 }}>Maaş Durumu — {MONTHS[new Date().getMonth()]} {year}</h3>
                        {unpaidCount > 0 && (
                            <Button icon={<Banknote size={16} />} onClick={handlePayAllSalaries} isLoading={saving}>
                                Tümünü Öde ({unpaidCount})
                            </Button>
                        )}
                    </div>

                    <Card noPadding>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' as const }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>Personel</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Rol</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Brüt</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>SGK (%14)</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Vergi (%15)</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Net</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Durum</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingSalaries.length === 0 ? (
                                    <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Aktif personel bulunamadı</td></tr>
                                ) : pendingSalaries.map((s: any) => (
                                    <tr key={s.Id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{s.FullName}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}><Badge variant="info">{s.Role}</Badge></td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{fmt(s.GrossSalary)}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>-{fmt(s.SgkDeduction)}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>-{fmt(s.TaxDeduction)}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>{fmt(s.NetSalary)}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            {s.IsPaid ? (
                                                <Badge variant="success"><CheckCircle size={10} /> Ödendi</Badge>
                                            ) : (
                                                <Badge variant="warning"><Clock size={10} /> Bekliyor</Badge>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            {!s.IsPaid && s.GrossSalary > 0 && (
                                                <Button size="sm" icon={<Banknote size={14} />} onClick={() => handlePaySalary(s.Id)} isLoading={saving}>Öde</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    {/* Salary history */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Maaş Ödeme Geçmişi</h3>
                        <Card noPadding>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' as const }}>
                                        <th style={{ padding: '0.75rem 1rem' }}>Personel</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Dönem</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Brüt</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>SGK</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Vergi</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Net</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Tarih</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salaryHistory.length === 0 ? (
                                        <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Henüz ödeme kaydı yok</td></tr>
                                    ) : salaryHistory.map((h: any) => (
                                        <tr key={h.Id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{h.EmployeeName}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}><Badge>{h.Period}</Badge></td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{fmt(h.GrossSalary)}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>-{fmt(h.SgkDeduction)}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>-{fmt(h.TaxDeduction)}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>{fmt(h.NetSalary)}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.PaidAt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                </>
            )}

            {/* ════════════════ VERGİ TAKİBİ ════════════════ */}
            {activeTab === 'tax' && (
                <>
                    <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>{year} Yılı Vergi Özeti</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Card>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧾</div>
                                <div className={styles.kpiLabel}>KDV (Toplanan)</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{fmt(taxData?.KDV?.Collected || 0)}</div>
                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Satışlardan toplanan KDV</p>
                            </div>
                        </Card>
                        <Card>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏥</div>
                                <div className={styles.kpiLabel}>SGK Toplam</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{fmt((taxData?.SGK?.Total || 0))}</div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                    <span>İşçi: {fmt(taxData?.SGK?.EmployeeShare || 0)}</span>
                                    <span>İşveren: {fmt(taxData?.SGK?.EmployerShare || 0)}</span>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                                <div className={styles.kpiLabel}>Gelir Vergisi</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{fmt(taxData?.IncomeTax || 0)}</div>
                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Maaş kesintilerinden</p>
                            </div>
                        </Card>
                    </div>

                    {/* Monthly KDV */}
                    <Card>
                        <h3 className={styles.sectionTitle}><Landmark size={16} /> Aylık KDV Tablosu</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                                    <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Ay</th>
                                    <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Toplanan KDV</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MONTHS.map((label, i) => {
                                    const m = (taxData?.KDV?.Monthly || []).find((x: any) => x.Month === i + 1);
                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '0.5rem 1rem' }}>{label} {year}</td>
                                            <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontWeight: 600 }}>{fmt(m?.Amount || 0)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: '2px solid var(--border-strong)' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>TOPLAM</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--accent-primary)' }}>{fmt(taxData?.KDV?.Collected || 0)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </Card>

                    {/* Grand total */}
                    <div style={{ marginTop: '1rem' }}>
                        <Card>
                            <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <div className={styles.kpiLabel}>Yıllık Toplam Vergi Yükü</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>{fmt(taxData?.GrandTotal || 0)}</div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>KDV + SGK (İşçi+İşveren) + Gelir Vergisi + Vergi Giderleri</p>
                            </div>
                        </Card>
                    </div>
                </>
            )}

            {/* ════════════════ KÂR/ZARAR + BORÇ ════════════════ */}
            {activeTab === 'profitloss' && (
                <>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        {[
                            { key: 'thisMonth', label: 'Bu Ay' },
                            { key: 'lastMonth', label: 'Geçen Ay' },
                            { key: 'thisYear', label: 'Bu Yıl' }
                        ].map(p => (
                            <Button key={p.key} variant={plPeriod === p.key ? 'primary' : 'outline'} size="sm" onClick={() => setPlPeriod(p.key)}>{p.label}</Button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* P&L Statement */}
                        <Card>
                            <h3 className={styles.sectionTitle}><FileText size={16} /> Kâr/Zarar Tablosu</h3>
                            <div>
                                <div className={styles.plRow}>
                                    <span className={styles.plLabel}>Brüt Satış Geliri</span>
                                    <span className={styles.plValue} style={{ color: 'var(--success)' }}>+{fmt(plData.Revenue || 0)}</span>
                                </div>
                                <div className={styles.plRow}>
                                    <span className={styles.plLabel}>Toplanan KDV</span>
                                    <span className={styles.plValue} style={{ color: 'var(--text-muted)' }}>{fmt(plData.TaxCollected || 0)}</span>
                                </div>
                                <div className={styles.plRow}>
                                    <span className={styles.plLabel}>İndirimler</span>
                                    <span className={styles.plValue} style={{ color: 'var(--warning)' }}>-{fmt(plData.Discounts || 0)}</span>
                                </div>
                                <div className={styles.plRow}>
                                    <span className={styles.plLabel}>Satılan Malın Maliyeti (SMM)</span>
                                    <span className={styles.plValue} style={{ color: 'var(--danger)' }}>-{fmt(plData.COGS || 0)}</span>
                                </div>
                                <div className={`${styles.plRow} ${styles.plTotal}`}>
                                    <span>Brüt Kâr</span>
                                    <span style={{ color: (plData.GrossProfit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(plData.GrossProfit || 0)}</span>
                                </div>
                                <div className={styles.plRow} style={{ marginTop: '0.5rem' }}>
                                    <span className={styles.plLabel}>Toplam Giderler</span>
                                    <span className={styles.plValue} style={{ color: 'var(--danger)' }}>-{fmt(plData.TotalExpenses || 0)}</span>
                                </div>
                                <div className={`${styles.plRow} ${styles.plTotal}`}>
                                    <span style={{ fontSize: '1rem' }}>📊 Net Kâr</span>
                                    <span style={{ fontSize: '1.25rem', color: (plData.NetProfit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {fmt(plData.NetProfit || 0)}
                                    </span>
                                </div>
                                {plData.ProfitMargin !== undefined && (
                                    <div style={{ textAlign: 'center', marginTop: '0.75rem', padding: '0.5rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kâr Marjı: </span>
                                        <Badge variant={(plData.ProfitMargin || 0) > 10 ? 'success' : (plData.ProfitMargin || 0) >= 0 ? 'warning' : 'danger'}>
                                            %{(plData.ProfitMargin || 0).toFixed(1)}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Gider detay + Borç */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Expense breakdown in P&L */}
                            <Card>
                                <h3 className={styles.sectionTitle}><Receipt size={16} /> Gider Dağılımı</h3>
                                {(plData.ExpensesByCategory || []).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Gider kaydı yok</div>
                                ) : (plData.ExpensesByCategory || []).map((c: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8125rem' }}>
                                        <span>{EXPENSE_CATEGORIES.find(ec => ec.label === c.Category)?.icon || '📋'} {c.Category}</span>
                                        <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-{fmt(c.Total)}</span>
                                    </div>
                                ))}
                            </Card>

                            {/* Borçlu müşteriler */}
                            <Card>
                                <h3 className={styles.sectionTitle}><Wallet size={16} /> Borçlu Müşteriler ({customers.length})</h3>
                                {customers.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Borçlu müşteri yok ✓</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {customers.slice(0, 8).map((c: any) => (
                                            <div key={c.Id}
                                                onClick={() => handleViewDebtHistory(c)}
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-subtle)', transition: 'border-color 0.15s' }}>
                                                <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{c.FullName}</span>
                                                <span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.875rem' }}>{fmt(c.DebtBalance)}</span>
                                            </div>
                                        ))}
                                        <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>TOPLAM ALACAK: </span>
                                            <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(totalDebt)}</span>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                </>
            )}

            {/* ═══ Gider Ekleme Modalı ═══ */}
            <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Yeni Gider Kaydı" size="md"
                footer={<><Button variant="outline" onClick={() => setShowExpenseModal(false)}>İptal</Button><Button icon={<Plus size={16} />} onClick={handleAddExpense} isLoading={saving}>Kaydet</Button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input label="Açıklama *" value={expenseForm.Description} onChange={e => setExpenseForm({ ...expenseForm, Description: e.target.value })} placeholder="Gider açıklaması" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input label="Tutar (₺) *" type="number" value={expenseForm.Amount} onChange={e => setExpenseForm({ ...expenseForm, Amount: e.target.value })} placeholder="0.00" />
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Kategori</label>
                            <select value={expenseForm.Category} onChange={e => setExpenseForm({ ...expenseForm, Category: parseInt(e.target.value) })}
                                style={{ width: '100%', padding: '0.625rem', background: 'var(--bg-body)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: '0.8125rem' }}>
                                {EXPENSE_CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input label="Tarih" type="date" value={expenseForm.Date} onChange={e => setExpenseForm({ ...expenseForm, Date: e.target.value })} />
                        <Input label="Not" value={expenseForm.Notes} onChange={e => setExpenseForm({ ...expenseForm, Notes: e.target.value })} placeholder="İsteğe bağlı" />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={expenseForm.IsRecurring} onChange={e => setExpenseForm({ ...expenseForm, IsRecurring: e.target.checked })} />
                        🔄 Tekrarlayan gider (kira, fatura vb.)
                    </label>
                </div>
            </Modal>

            {/* ═══ Borç Geçmişi Modalı ═══ */}
            <Modal isOpen={!!selectedCustomerDebt} onClose={() => setSelectedCustomerDebt(null)} title={`Ödeme Geçmişi: ${selectedCustomerDebt?.FullName}`} size="sm">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>MEVCUT BORÇ</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>{fmt(selectedCustomerDebt?.DebtBalance || 0)}</div>
                    </div>
                    {debtHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Henüz ödeme kaydı yok</div>
                    ) : debtHistory.map((h: any) => (
                        <div key={h.Id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                            <div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--success)' }}>+{fmt(h.Amount)}</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{h.Date}</div>
                            </div>
                            {h.Notes && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{h.Notes}</span>}
                        </div>
                    ))}
                </div>
            </Modal>
        </PageTransition>
    );
}
