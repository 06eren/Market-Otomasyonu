using System;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading.Tasks;
using Market_Otomasyonu.Models;
using Microsoft.EntityFrameworkCore;

namespace Market_Otomasyonu.Services
{
    [ComVisible(true)]
    public class AccountingService
    {
        private static Data.IUnitOfWork CreateUnitOfWork()
        {
            return new Data.UnitOfWork(new Data.MarketContext());
        }

        // ── Expense CRUD ──

        public async Task<string> AddExpenseAsync(string json)
        {
            try
            {
                using var uow = CreateUnitOfWork();
                var data = JsonSerializer.Deserialize<JsonElement>(json);
                var expense = new Expense
                {
                    Description = data.GetProperty("Description").GetString() ?? "",
                    Amount = data.GetProperty("Amount").GetDecimal(),
                    Category = (ExpenseCategory)data.GetProperty("Category").GetInt32(),
                    Date = data.TryGetProperty("Date", out var d) && d.ValueKind != JsonValueKind.Null
                        ? DateTime.Parse(d.GetString()!) : DateTime.Now,
                    Notes = data.TryGetProperty("Notes", out var n) ? n.GetString() : null,
                    IsRecurring = data.TryGetProperty("IsRecurring", out var r) && r.GetBoolean(),
                    CreatedAt = DateTime.Now
                };

                if (string.IsNullOrWhiteSpace(expense.Description))
                    return JsonSerializer.Serialize(new { success = false, message = "Açıklama boş olamaz." });
                if (expense.Amount <= 0)
                    return JsonSerializer.Serialize(new { success = false, message = "Tutar sıfırdan büyük olmalı." });

                await uow.Expenses.AddAsync(expense);
                await uow.CompleteAsync();
                return JsonSerializer.Serialize(new { success = true });
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public async Task<string> GetExpensesAsync(string startDate, string endDate)
        {
            using var uow = CreateUnitOfWork();
            var start = DateTime.Parse(startDate);
            var end = DateTime.Parse(endDate).AddDays(1);

            var expenses = await uow.Expenses.Query()
                .Where(e => e.Date >= start && e.Date < end)
                .OrderByDescending(e => e.Date)
                .Select(e => new
                {
                    e.Id,
                    e.Description,
                    e.Amount,
                    Category = (int)e.Category,
                    CategoryName = e.Category.ToString(),
                    Date = e.Date.ToString("dd.MM.yyyy"),
                    e.Notes,
                    e.IsRecurring
                })
                .ToListAsync();

            return JsonSerializer.Serialize(expenses);
        }

        public async Task<string> DeleteExpenseAsync(int id)
        {
            using var uow = CreateUnitOfWork();
            var expense = await uow.Expenses.GetByIdAsync(id);
            if (expense == null) return JsonSerializer.Serialize(new { success = false, message = "Gider bulunamadı." });

            uow.Expenses.Remove(expense);
            await uow.CompleteAsync();
            return JsonSerializer.Serialize(new { success = true });
        }

        public async Task<string> GetExpenseSummaryAsync(string startDate, string endDate)
        {
            using var uow = CreateUnitOfWork();
            var start = DateTime.Parse(startDate);
            var end = DateTime.Parse(endDate).AddDays(1);

            var expenses = await uow.Expenses.Query()
                .Where(e => e.Date >= start && e.Date < end)
                .ToListAsync();

            var byCategory = expenses
                .GroupBy(e => e.Category)
                .Select(g => new
                {
                    Category = (int)g.Key,
                    CategoryName = g.Key.ToString(),
                    Total = g.Sum(e => e.Amount),
                    Count = g.Count()
                })
                .OrderByDescending(x => x.Total)
                .ToList();

            return JsonSerializer.Serialize(new
            {
                TotalExpenses = expenses.Sum(e => e.Amount),
                Count = expenses.Count,
                ByCategory = byCategory
            });
        }

        // ── Salary Management ──

        public async Task<string> GetPendingSalariesAsync()
        {
            using var uow = CreateUnitOfWork();
            var currentPeriod = DateTime.Now.ToString("yyyy-MM");

            var employees = await uow.Employees.Query()
                .Where(e => e.IsActive)
                .ToListAsync();

            var paidIds = await uow.SalaryPayments.Query()
                .Where(sp => sp.Period == currentPeriod)
                .Select(sp => sp.EmployeeId)
                .ToListAsync();

            var result = employees.Select(e =>
            {
                var sgk = e.BaseSalary * (e.SgkRate / 100m);
                var tax = (e.BaseSalary - sgk) * (e.TaxRate / 100m);
                var net = e.BaseSalary - sgk - tax;
                return new
                {
                    e.Id,
                    e.FullName,
                    Role = e.Role.ToString(),
                    GrossSalary = e.BaseSalary,
                    SgkDeduction = sgk,
                    TaxDeduction = tax,
                    NetSalary = net,
                    IsPaid = paidIds.Contains(e.Id),
                    Period = currentPeriod
                };
            });

            return JsonSerializer.Serialize(result);
        }

        public async Task<string> PaySalaryAsync(string json)
        {
            try
            {
                using var uow = CreateUnitOfWork();
                var data = JsonSerializer.Deserialize<JsonElement>(json);
                var employeeId = data.GetProperty("EmployeeId").GetInt32();
                var period = data.TryGetProperty("Period", out var p) ? p.GetString() ?? DateTime.Now.ToString("yyyy-MM") : DateTime.Now.ToString("yyyy-MM");

                var employee = await uow.Employees.GetByIdAsync(employeeId);
                if (employee == null)
                    return JsonSerializer.Serialize(new { success = false, message = "Personel bulunamadı." });

                // Check if already paid
                var alreadyPaid = await uow.SalaryPayments.Query()
                    .AnyAsync(sp => sp.EmployeeId == employeeId && sp.Period == period);
                if (alreadyPaid)
                    return JsonSerializer.Serialize(new { success = false, message = $"{period} dönemi için maaş zaten ödenmiş." });

                var sgk = employee.BaseSalary * (employee.SgkRate / 100m);
                var tax = (employee.BaseSalary - sgk) * (employee.TaxRate / 100m);
                var net = employee.BaseSalary - sgk - tax;

                var payment = new SalaryPayment
                {
                    EmployeeId = employeeId,
                    GrossSalary = employee.BaseSalary,
                    NetSalary = net,
                    TaxDeduction = tax,
                    SgkDeduction = sgk,
                    Period = period,
                    PaidAt = DateTime.Now,
                    Notes = data.TryGetProperty("Notes", out var n) ? n.GetString() : null
                };

                await uow.SalaryPayments.AddAsync(payment);

                // Also create an expense record
                var expense = new Expense
                {
                    Description = $"Maaş: {employee.FullName} ({period})",
                    Amount = net,
                    Category = ExpenseCategory.Salary,
                    Date = DateTime.Now,
                    EmployeeId = employeeId,
                    CreatedAt = DateTime.Now
                };
                await uow.Expenses.AddAsync(expense);

                await uow.CompleteAsync();
                return JsonSerializer.Serialize(new { success = true, message = $"{employee.FullName} — ₺{net:F2} net maaş ödendi." });
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public async Task<string> PayAllSalariesAsync()
        {
            try
            {
                using var uow = CreateUnitOfWork();
                var currentPeriod = DateTime.Now.ToString("yyyy-MM");

                var employees = await uow.Employees.Query()
                    .Where(e => e.IsActive && e.BaseSalary > 0)
                    .ToListAsync();

                var paidIds = await uow.SalaryPayments.Query()
                    .Where(sp => sp.Period == currentPeriod)
                    .Select(sp => sp.EmployeeId)
                    .ToListAsync();

                var unpaid = employees.Where(e => !paidIds.Contains(e.Id)).ToList();
                if (!unpaid.Any())
                    return JsonSerializer.Serialize(new { success = false, message = "Bu dönem tüm maaşlar zaten ödenmiş." });

                foreach (var emp in unpaid)
                {
                    var sgk = emp.BaseSalary * (emp.SgkRate / 100m);
                    var tax = (emp.BaseSalary - sgk) * (emp.TaxRate / 100m);
                    var net = emp.BaseSalary - sgk - tax;

                    await uow.SalaryPayments.AddAsync(new SalaryPayment
                    {
                        EmployeeId = emp.Id,
                        GrossSalary = emp.BaseSalary,
                        NetSalary = net,
                        TaxDeduction = tax,
                        SgkDeduction = sgk,
                        Period = currentPeriod,
                        PaidAt = DateTime.Now
                    });

                    await uow.Expenses.AddAsync(new Expense
                    {
                        Description = $"Maaş: {emp.FullName} ({currentPeriod})",
                        Amount = net,
                        Category = ExpenseCategory.Salary,
                        Date = DateTime.Now,
                        EmployeeId = emp.Id,
                        CreatedAt = DateTime.Now
                    });
                }

                await uow.CompleteAsync();
                return JsonSerializer.Serialize(new { success = true, message = $"{unpaid.Count} personelin maaşı ödendi." });
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public async Task<string> GetSalaryHistoryAsync()
        {
            using var uow = CreateUnitOfWork();
            var history = await uow.SalaryPayments.Query()
                .OrderByDescending(sp => sp.PaidAt)
                .Take(100)
                .Select(sp => new
                {
                    sp.Id,
                    sp.EmployeeId,
                    EmployeeName = sp.Employee != null ? sp.Employee.FullName : "?",
                    sp.GrossSalary,
                    sp.NetSalary,
                    sp.TaxDeduction,
                    sp.SgkDeduction,
                    sp.Period,
                    PaidAt = sp.PaidAt.ToString("dd.MM.yyyy HH:mm"),
                    sp.Notes
                })
                .ToListAsync();

            return JsonSerializer.Serialize(history);
        }

        // ── Tax Summary ──

        public async Task<string> GetTaxSummaryAsync(int year)
        {
            using var uow = CreateUnitOfWork();
            var startOfYear = new DateTime(year, 1, 1);
            var endOfYear = new DateTime(year + 1, 1, 1);

            // KDV from sales
            var totalKdv = await uow.Sales.Query()
                .Where(s => s.Date >= startOfYear && s.Date < endOfYear)
                .SumAsync(s => (decimal?)s.TaxAmount) ?? 0;

            // Salary payments for the year
            var yearStr = year.ToString();
            var salaryPayments = await uow.SalaryPayments.Query()
                .Where(sp => sp.Period.StartsWith(yearStr))
                .ToListAsync();

            var totalSgkEmployee = salaryPayments.Sum(sp => sp.SgkDeduction);
            var totalSgkEmployer = salaryPayments.Sum(sp => sp.GrossSalary * 0.205m); // %20.5 employer
            var totalIncomeTax = salaryPayments.Sum(sp => sp.TaxDeduction);
            var totalGross = salaryPayments.Sum(sp => sp.GrossSalary);

            // Tax expenses from Expense table
            var taxExpenses = await uow.Expenses.Query()
                .Where(e => e.Category == ExpenseCategory.Tax && e.Date >= startOfYear && e.Date < endOfYear)
                .SumAsync(e => (decimal?)e.Amount) ?? 0;

            // Monthly breakdown
            var monthlyKdv = await uow.Sales.Query()
                .Where(s => s.Date >= startOfYear && s.Date < endOfYear)
                .GroupBy(s => s.Date.Month)
                .Select(g => new { Month = g.Key, Amount = g.Sum(s => s.TaxAmount) })
                .ToListAsync();

            return JsonSerializer.Serialize(new
            {
                Year = year,
                KDV = new { Collected = totalKdv, Monthly = monthlyKdv },
                SGK = new { EmployeeShare = totalSgkEmployee, EmployerShare = totalSgkEmployer, Total = totalSgkEmployee + totalSgkEmployer },
                IncomeTax = totalIncomeTax,
                TaxExpenses = taxExpenses,
                TotalGrossSalary = totalGross,
                GrandTotal = totalKdv + totalSgkEmployee + totalSgkEmployer + totalIncomeTax + taxExpenses
            });
        }

        // ── Profit & Loss ──

        public async Task<string> GetProfitLossAsync(string startDate, string endDate)
        {
            using var uow = CreateUnitOfWork();
            var start = DateTime.Parse(startDate);
            var end = DateTime.Parse(endDate).AddDays(1);

            // Revenue
            var sales = await uow.Sales.Query()
                .Where(s => s.Date >= start && s.Date < end)
                .ToListAsync();
            var totalRevenue = sales.Sum(s => s.TotalAmount);
            var totalTax = sales.Sum(s => s.TaxAmount);
            var totalDiscount = sales.Sum(s => s.DiscountAmount);

            // COGS (Cost of Goods Sold) — from sale items joined with products
            var saleIds = sales.Select(s => s.Id).ToList();
            var cogs = await uow.SaleItems.Query()
                .Where(si => saleIds.Contains(si.SaleId))
                .Join(uow.Products.Query(), si => si.ProductId, p => p.Id, (si, p) => si.Quantity * p.PurchasePrice)
                .SumAsync(x => (decimal?)x) ?? 0;

            // Expenses
            var expenses = await uow.Expenses.Query()
                .Where(e => e.Date >= start && e.Date < end)
                .ToListAsync();
            var totalExpenses = expenses.Sum(e => e.Amount);

            var grossProfit = totalRevenue - cogs;
            var netProfit = grossProfit - totalExpenses;
            var profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

            var expensesByCategory = expenses
                .GroupBy(e => e.Category)
                .Select(g => new { Category = g.Key.ToString(), Total = g.Sum(e => e.Amount) })
                .OrderByDescending(x => x.Total)
                .ToList();

            return JsonSerializer.Serialize(new
            {
                Period = new { Start = start.ToString("dd.MM.yyyy"), End = end.AddDays(-1).ToString("dd.MM.yyyy") },
                Revenue = totalRevenue,
                TaxCollected = totalTax,
                Discounts = totalDiscount,
                COGS = cogs,
                GrossProfit = grossProfit,
                TotalExpenses = totalExpenses,
                ExpensesByCategory = expensesByCategory,
                NetProfit = netProfit,
                ProfitMargin = profitMargin,
                SaleCount = sales.Count
            });
        }

        public async Task<string> GetMonthlySummaryAsync(int year)
        {
            using var uow = CreateUnitOfWork();
            var startOfYear = new DateTime(year, 1, 1);
            var endOfYear = new DateTime(year + 1, 1, 1);

            var monthlySales = await uow.Sales.Query()
                .Where(s => s.Date >= startOfYear && s.Date < endOfYear)
                .GroupBy(s => s.Date.Month)
                .Select(g => new { Month = g.Key, Revenue = g.Sum(s => s.TotalAmount) })
                .ToListAsync();

            var monthlyExpenses = await uow.Expenses.Query()
                .Where(e => e.Date >= startOfYear && e.Date < endOfYear)
                .GroupBy(e => e.Date.Month)
                .Select(g => new { Month = g.Key, Expenses = g.Sum(e => e.Amount) })
                .ToListAsync();

            var months = Enumerable.Range(1, 12).Select(m =>
            {
                var rev = monthlySales.FirstOrDefault(x => x.Month == m)?.Revenue ?? 0;
                var exp = monthlyExpenses.FirstOrDefault(x => x.Month == m)?.Expenses ?? 0;
                return new
                {
                    Month = m,
                    Revenue = rev,
                    Expenses = exp,
                    Profit = rev - exp
                };
            });

            return JsonSerializer.Serialize(months);
        }

        // ── Debt Payment History ──

        public async Task<string> GetDebtPaymentHistoryAsync(int customerId)
        {
            using var uow = CreateUnitOfWork();
            var history = await uow.DebtPayments.Query()
                .Where(dp => dp.CustomerId == customerId)
                .OrderByDescending(dp => dp.Date)
                .Select(dp => new
                {
                    dp.Id,
                    dp.Amount,
                    Date = dp.Date.ToString("dd.MM.yyyy HH:mm"),
                    dp.Notes
                })
                .ToListAsync();

            return JsonSerializer.Serialize(history);
        }
    }
}
