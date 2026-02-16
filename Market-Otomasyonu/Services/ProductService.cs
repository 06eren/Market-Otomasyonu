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
        public string Barcode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal SalePrice { get; set; }
        public int StockQuantity { get; set; }
        public string CategoryName { get; set; } = string.Empty;
    }

    [ComVisible(true)]
    public class ProductService
    {
        private static Data.IUnitOfWork CreateUnitOfWork()
        {
            return new Data.UnitOfWork(new Data.MarketContext());
        }

        public async Task<string> GetProductsJsonAsync()
        {
            using var uow = CreateUnitOfWork();
            var products = await uow.Products.GetAllAsync();
            var dtos = System.Linq.Enumerable.Select(products, p => new
            {
                p.Id, p.Barcode, p.Name, p.Description,
                p.SalePrice, p.PurchasePrice, p.StockQuantity,
                p.CriticalStockLevel, p.CategoryId,
                Category = p.Category != null ? new { p.Category.Id, p.Category.Name } : null
            });
            return System.Text.Json.JsonSerializer.Serialize(dtos);
        }

        public async Task<bool> AddProductAsync(string productJson)
        {
            try
            {
                using var uow = CreateUnitOfWork();
                var product = System.Text.Json.JsonSerializer.Deserialize<Product>(productJson);
                if (product == null) return false;

                // Basic validation
                if (string.IsNullOrWhiteSpace(product.Barcode) || string.IsNullOrWhiteSpace(product.Name))
                    throw new Exception("Barkod ve Ürün Adı zorunludur.");

                // Check duplicate barcode
                var existing = await uow.Products.FindAsync(p => p.Barcode == product.Barcode);
                if (System.Linq.Enumerable.Any(existing))
                    throw new Exception("Bu barkod ile kayıtlı ürün zaten var.");

                product.CreatedAt = DateTime.Now;
                product.UpdatedAt = DateTime.Now;

                await uow.Products.AddAsync(product);
                await uow.CompleteAsync();
                return true;
            }
            catch
            {
                throw;
            }
        }

        public async Task<string> UpdateProductAsync(string productJson)
        {
            try
            {
                using var uow = CreateUnitOfWork();
                var dto = System.Text.Json.JsonSerializer.Deserialize<Product>(productJson);
                if (dto == null) return "{\"success\":false,\"message\":\"Geçersiz veri\"}";

                var product = await uow.Products.GetByIdAsync(dto.Id);
                if (product == null) return "{\"success\":false,\"message\":\"Ürün bulunamadı\"}";

                product.Name = dto.Name;
                product.Barcode = dto.Barcode;
                product.Description = dto.Description;
                product.SalePrice = dto.SalePrice;
                product.PurchasePrice = dto.PurchasePrice;
                product.StockQuantity = dto.StockQuantity;
                product.CriticalStockLevel = dto.CriticalStockLevel;
                product.CategoryId = dto.CategoryId;
                product.UpdatedAt = DateTime.Now;

                uow.Products.Update(product);
                await uow.CompleteAsync();
                return "{\"success\":true}";
            }
            catch (Exception ex)
            {
                return System.Text.Json.JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public async Task<string> GetProductByBarcodeAsync(string barcode)
        {
            using var uow = CreateUnitOfWork();
            var products = await uow.Products.FindAsync(p => p.Barcode == barcode);
            var product = System.Linq.Enumerable.FirstOrDefault(products);
            if (product == null) return "null";
            var dto = new
            {
                product.Id, product.Barcode, product.Name, product.Description,
                product.SalePrice, product.PurchasePrice, product.StockQuantity,
                product.CriticalStockLevel, product.CategoryId,
                Category = product.Category != null ? new { product.Category.Id, product.Category.Name } : null
            };
            return System.Text.Json.JsonSerializer.Serialize(dto);
        }

        public async Task<string> GetCategoriesJsonAsync()
        {
            using var uow = CreateUnitOfWork();
            var categories = await uow.Categories.GetAllAsync();
            var dtos = System.Linq.Enumerable.Select(categories, c => new
            {
                c.Id, c.Name, c.Description
            });
            return System.Text.Json.JsonSerializer.Serialize(dtos);
        }

        public async Task<string> GetLowStockProductsAsync()
        {
            using var uow = CreateUnitOfWork();
            var products = await uow.Products.FindAsync(p => p.StockQuantity <= p.CriticalStockLevel);
            var dtos = System.Linq.Enumerable.Select(products, p => new
            {
                p.Id, p.Name, p.Barcode, p.StockQuantity, p.CriticalStockLevel
            });
            return System.Text.Json.JsonSerializer.Serialize(dtos);
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            using var uow = CreateUnitOfWork();
            var product = await uow.Products.GetByIdAsync(id);
            if (product == null) return false;

            uow.Products.Remove(product);
            await uow.CompleteAsync();
            return true;
        }

        public async Task SeedInitialDataAsync()
        {
             using var uow = CreateUnitOfWork();
             var existing = await uow.Products.GetAllAsync();
             if (System.Linq.Enumerable.Any(existing)) return;

             // Add Products
             var p1 = new Product { Name = "Ekmek", Barcode = "8690001", SalePrice = 10.00m, PurchasePrice = 8.50m, StockQuantity = 100, CategoryId = 1, Description = "Taze odun ekmeği" };
             var p2 = new Product { Name = "Süt", Barcode = "8690002", SalePrice = 25.00m, PurchasePrice = 20.00m, StockQuantity = 50, CategoryId = 1, Description = "Tam yağlı inek sütü" };
             var p3 = new Product { Name = "Yumurta (30'lu)", Barcode = "8690003", SalePrice = 120.00m, PurchasePrice = 95.00m, StockQuantity = 200, CategoryId = 1, Description = "L boy yumurta" };
             var p4 = new Product { Name = "Çamaşır Suyu", Barcode = "8690004", SalePrice = 45.50m, PurchasePrice = 30.00m, StockQuantity = 20, CategoryId = 2, Description = "Dağ esintisi" };
             var p5 = new Product { Name = "Domates (kg)", Barcode = "8690005", SalePrice = 35.00m, PurchasePrice = 25.00m, StockQuantity = 500, CategoryId = 3, Description = "Antalya domatesi" };

             await uow.Products.AddRangeAsync(new[] { p1, p2, p3, p4, p5 });
             await uow.CompleteAsync();
        }
    }
}
