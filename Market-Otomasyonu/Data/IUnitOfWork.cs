using System;
using System.Threading.Tasks;
using Market_Otomasyonu.Models;

namespace Market_Otomasyonu.Data
{
    public interface IUnitOfWork : IDisposable
    {
        IRepository<Product> Products { get; }
        IRepository<Category> Categories { get; }
        IRepository<Sale> Sales { get; }
        IRepository<SaleItem> SaleItems { get; }
        IRepository<Customer> Customers { get; }
        IRepository<Employee> Employees { get; }
        IRepository<ActivityLog> ActivityLogs { get; }
        IRepository<Expense> Expenses { get; }
        IRepository<DebtPayment> DebtPayments { get; }
        IRepository<SalaryPayment> SalaryPayments { get; }
        
        Task<int> CompleteAsync();
    }
}
