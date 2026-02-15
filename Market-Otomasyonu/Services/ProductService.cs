using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Market_Otomasyonu.Models;

namespace Market_Otomasyonu.Services
{
    // Define a clean interface for the frontend
    public class ProductDto
    {
        public int Id { get; set; }
        public string Barcode { get; set; }
        public string Name { get; set; }
        public decimal SalePrice { get; set; }
        public int StockQuantity { get; set; }
        public string CategoryName { get; set; }
    }

    [ComVisible(true)]
    public class ProductService
    {
        private readonly Data.IUnitOfWork _unitOfWork;

        public ProductService()
        {
            // Ideally use DI, but for Interop simplicity with MainWindow instance logic:
            var context = new Data.MarketContext(); // In a real app, use a factory or DI scope
            _unitOfWork = new Data.UnitOfWork(context);
        }

        public async Task<string> GetProductsJsonAsync()
        {
            var products = await _unitOfWork.Products.GetAllAsync();
            return System.Text.Json.JsonSerializer.Serialize(products);
        }
        
        public async Task SeedInitialDataAsync()
        {
             var existing = await _unitOfWork.Products.GetAllAsync();
             if (System.Linq.Enumerable.Any(existing)) return;

             // Ensure Categories exist first - EF Core HasData in OnModelCreating handles creation, 
             // but we must ensure they are saved if migration didn't run properly (though it should have).
             
             // Add Products
             var p1 = new Product { Name = "Ekmek", Barcode = "8690001", SalePrice = 10.00m, PurchasePrice = 8.50m, StockQuantity = 100, CategoryId = 1, Description = "Taze odun ekmeği" };
             var p2 = new Product { Name = "Süt", Barcode = "8690002", SalePrice = 25.00m, PurchasePrice = 20.00m, StockQuantity = 50, CategoryId = 1, Description = "Tam yağlı inek sütü" };
             var p3 = new Product { Name = "Yumurta (30'lu)", Barcode = "8690003", SalePrice = 120.00m, PurchasePrice = 95.00m, StockQuantity = 200, CategoryId = 1, Description = "L boy yumurta" };
             var p4 = new Product { Name = "Çamaşır Suyu", Barcode = "8690004", SalePrice = 45.50m, PurchasePrice = 30.00m, StockQuantity = 20, CategoryId = 2, Description = "Dağ esintisi" };
             var p5 = new Product { Name = "Domates (kg)", Barcode = "8690005", SalePrice = 35.00m, PurchasePrice = 25.00m, StockQuantity = 500, CategoryId = 3, Description = "Antalya domatesi" };

             await _unitOfWork.Products.AddRangeAsync(new[] { p1, p2, p3, p4, p5 });
             await _unitOfWork.CompleteAsync();
        }
    }
}
