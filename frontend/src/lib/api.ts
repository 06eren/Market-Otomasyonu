// WebView2 Interop API Layer
// All functions communicate with C# backend via chrome.webview.hostObjects

// ─── Helpers ───────────────────────────────────────────────
async function getHost(name: string): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).chrome?.webview?.hostObjects) {
        return (window as any).chrome.webview.hostObjects[name];
    }
    return null;
}

async function callService(serviceName: string, method: string, ...args: any[]): Promise<any> {
    const host = await getHost(serviceName);
    if (!host) {
        console.warn(`[API] Service "${serviceName}" not available (dev mode?)`);
        return null;
    }
    return await host[method](...args);
}

function parseJson(raw: string | null, fallback: any = []) {
    if (!raw || raw === 'null') return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
}

// ─── Product Service ───────────────────────────────────────
export async function getProducts(): Promise<any[]> {
    const raw = await callService('productService', 'GetProductsJsonAsync');
    return parseJson(raw, []);
}

export async function addProduct(product: any): Promise<boolean> {
    return await callService('productService', 'AddProductAsync', JSON.stringify(product)) ?? false;
}

export async function updateProduct(product: any): Promise<any> {
    const raw = await callService('productService', 'UpdateProductAsync', JSON.stringify(product));
    return parseJson(raw, { success: false });
}

export async function deleteProduct(id: number): Promise<boolean> {
    return await callService('productService', 'DeleteProductAsync', id) ?? false;
}

export async function getProductByBarcode(barcode: string): Promise<any | null> {
    const raw = await callService('productService', 'GetProductByBarcodeAsync', barcode);
    return parseJson(raw, null);
}

export async function getCategories(): Promise<any[]> {
    const raw = await callService('productService', 'GetCategoriesJsonAsync');
    return parseJson(raw, []);
}

export async function getLowStockProducts(): Promise<any[]> {
    const raw = await callService('productService', 'GetLowStockProductsAsync');
    return parseJson(raw, []);
}

// ─── Sale Service ──────────────────────────────────────────
export async function processSale(data: any): Promise<any> {
    const raw = await callService('saleService', 'ProcessSaleAsync', JSON.stringify(data));
    return parseJson(raw, { success: false });
}

export async function getInvoices(): Promise<any[]> {
    const raw = await callService('saleService', 'GetRecentSalesAsync');
    return parseJson(raw, []);
}

export async function getDashboardStats(): Promise<any> {
    const raw = await callService('saleService', 'GetDashboardStatsAsync');
    return parseJson(raw, { DailyTurnover: 0, DailyTransactions: 0, TotalStock: 0 });
}

// ─── Customer Service ──────────────────────────────────────
export async function getCustomers(): Promise<any[]> {
    const raw = await callService('customerService', 'GetCustomersJsonAsync');
    return parseJson(raw, []);
}

export async function addCustomer(customer: any): Promise<any> {
    const raw = await callService('customerService', 'AddCustomerAsync', JSON.stringify(customer));
    return parseJson(raw, { success: false });
}

export async function updateCustomer(customer: any): Promise<any> {
    const raw = await callService('customerService', 'UpdateCustomerAsync', JSON.stringify(customer));
    return parseJson(raw, { success: false });
}

export async function deleteCustomer(id: number): Promise<any> {
    const raw = await callService('customerService', 'DeleteCustomerAsync', id);
    return parseJson(raw, { success: false });
}

export async function payDebt(customerId: number, amount: number): Promise<any> {
    const raw = await callService('customerService', 'PayDebtAsync', JSON.stringify({ CustomerId: customerId, Amount: amount }));
    return parseJson(raw, { success: false });
}

// ─── Settings Service ──────────────────────────────────────
export async function getSettings(): Promise<any> {
    const raw = await callService('settingsService', 'GetSettingsAsync');
    return parseJson(raw, {});
}

export async function saveSettings(settings: any): Promise<any> {
    const raw = await callService('settingsService', 'SaveSettingsAsync', JSON.stringify(settings));
    return parseJson(raw, { success: false });
}

export async function backupDatabase(): Promise<any> {
    const raw = await callService('settingsService', 'BackupDatabaseAsync');
    return parseJson(raw, { success: false });
}

export async function resetDatabase(): Promise<any> {
    const raw = await callService('settingsService', 'ResetDatabaseAsync');
    return parseJson(raw, { success: false });
}

// ─── Auth Service ──────────────────────────────────────────
export async function login(username: string, password: string): Promise<any> {
    const raw = await callService('authService', 'LoginAsync', username, password);
    return parseJson(raw, { success: false });
}

export async function logout(): Promise<any> {
    const raw = await callService('authService', 'LogoutAsync');
    return parseJson(raw, { success: false });
}

export async function getCurrentUser(): Promise<any> {
    const raw = await callService('authService', 'GetCurrentUser');
    return parseJson(raw, { loggedIn: false });
}

export async function getEmployees(): Promise<any[]> {
    const raw = await callService('authService', 'GetEmployeesAsync');
    return parseJson(raw, []);
}

export async function addEmployee(data: any): Promise<any> {
    const raw = await callService('authService', 'AddEmployeeAsync', JSON.stringify(data));
    return parseJson(raw, { success: false });
}

export async function updateEmployee(data: any): Promise<any> {
    const raw = await callService('authService', 'UpdateEmployeeAsync', JSON.stringify(data));
    return parseJson(raw, { success: false });
}

export async function deleteEmployee(id: number): Promise<any> {
    const raw = await callService('authService', 'DeleteEmployeeAsync', id);
    return parseJson(raw, { success: false });
}

export async function getActivityLog(count: number = 50): Promise<any[]> {
    const raw = await callService('authService', 'GetActivityLogAsync', count);
    return parseJson(raw, []);
}

// ─── Accounting Service ────────────────────────────────────
export async function addExpense(data: any): Promise<any> {
    const raw = await callService('accountingService', 'AddExpenseAsync', JSON.stringify(data));
    return parseJson(raw, { success: false });
}

export async function getExpenses(startDate: string, endDate: string): Promise<any[]> {
    const raw = await callService('accountingService', 'GetExpensesAsync', startDate, endDate);
    return parseJson(raw, []);
}

export async function deleteExpense(id: number): Promise<any> {
    const raw = await callService('accountingService', 'DeleteExpenseAsync', id);
    return parseJson(raw, { success: false });
}

export async function getExpenseSummary(startDate: string, endDate: string): Promise<any> {
    const raw = await callService('accountingService', 'GetExpenseSummaryAsync', startDate, endDate);
    return parseJson(raw, { TotalExpenses: 0, Count: 0, ByCategory: [] });
}

export async function getPendingSalaries(): Promise<any[]> {
    const raw = await callService('accountingService', 'GetPendingSalariesAsync');
    return parseJson(raw, []);
}

export async function paySalary(data: any): Promise<any> {
    const raw = await callService('accountingService', 'PaySalaryAsync', JSON.stringify(data));
    return parseJson(raw, { success: false });
}

export async function payAllSalaries(): Promise<any> {
    const raw = await callService('accountingService', 'PayAllSalariesAsync');
    return parseJson(raw, { success: false });
}

export async function getSalaryHistory(): Promise<any[]> {
    const raw = await callService('accountingService', 'GetSalaryHistoryAsync');
    return parseJson(raw, []);
}

export async function getTaxSummary(year: number): Promise<any> {
    const raw = await callService('accountingService', 'GetTaxSummaryAsync', year);
    return parseJson(raw, {});
}

export async function getProfitLoss(startDate: string, endDate: string): Promise<any> {
    const raw = await callService('accountingService', 'GetProfitLossAsync', startDate, endDate);
    return parseJson(raw, {});
}

export async function getMonthlySummary(year: number): Promise<any[]> {
    const raw = await callService('accountingService', 'GetMonthlySummaryAsync', year);
    return parseJson(raw, []);
}

export async function getDebtPaymentHistory(customerId: number): Promise<any[]> {
    const raw = await callService('accountingService', 'GetDebtPaymentHistoryAsync', customerId);
    return parseJson(raw, []);
}
