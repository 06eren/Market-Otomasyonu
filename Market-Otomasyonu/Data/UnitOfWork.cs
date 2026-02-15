using System.Threading.Tasks;
using Market_Otomasyonu.Models;

namespace Market_Otomasyonu.Data
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly MarketContext _context;

        public IRepository<Product> Products { get; private set; }
        public IRepository<Category> Categories { get; private set; }
        public IRepository<Sale> Sales { get; private set; }
        public IRepository<Customer> Customers { get; private set; }

        public UnitOfWork(MarketContext context)
        {
            _context = context;
            Products = new Repository<Product>(_context);
            Categories = new Repository<Category>(_context);
            Sales = new Repository<Sale>(_context);
            Customers = new Repository<Customer>(_context);
        }

        public async Task<int> CompleteAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
