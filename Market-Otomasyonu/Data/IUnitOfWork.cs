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
        IRepository<Customer> Customers { get; }
        
        Task<int> CompleteAsync();
    }
}
