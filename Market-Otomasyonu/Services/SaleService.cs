using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Market_Otomasyonu.Models;
using System.Linq;

namespace Market_Otomasyonu.Services
{
    // DTOs for JSON deserialization
    public class SaleDto
    {
        public decimal TotalAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public List<SaleItemDto> Items { get; set; } = new();
        public int PaymentMethod { get; set; } // 0: Cash, 1: CreditCard, 2: Debit (Veresiye)
        public int? CustomerId { get; set; }
    }

    public class SaleItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    [ComVisible(true)]
    public class SaleService
    {
        private readonly Data.IUnitOfWork _unitOfWork;

        public SaleService()
        {
            var context = new Data.MarketContext();
            _unitOfWork = new Data.UnitOfWork(context);
        }

        public async Task<string> ProcessSaleAsync(string saleJson)
        {
            try
            {
                var saleDto = System.Text.Json.JsonSerializer.Deserialize<SaleDto>(saleJson);
                if (saleDto == null || saleDto.Items == null || !saleDto.Items.Any())
                    throw new Exception("Geçersiz satış verisi.");

                var sale = new Sale
                {
                    TransactionId = Guid.NewGuid().ToString(),
                    Date = DateTime.Now,
                    TotalAmount = saleDto.TotalAmount,
                    TaxAmount = saleDto.TaxAmount,
                    PaymentMethod = (PaymentMethod)saleDto.PaymentMethod,
                    CustomerId = saleDto.CustomerId
                };

                await _unitOfWork.Sales.AddAsync(sale);

                foreach (var itemDto in saleDto.Items)
                {
                    var product = await _unitOfWork.Products.GetByIdAsync(itemDto.ProductId);
                    if (product == null) throw new Exception($"Ürün bulunamadı: {itemDto.ProductId}");

                    if (product.StockQuantity < itemDto.Quantity)
                        throw new Exception($"Yetersiz stok: {product.Name}");

                    product.StockQuantity -= itemDto.Quantity;
                    _unitOfWork.Products.Update(product);

                    var saleItem = new SaleItem
                    {
                        Sale = sale,
                        ProductId = itemDto.ProductId,
                        Quantity = itemDto.Quantity,
                        UnitPrice = itemDto.UnitPrice,
                        TotalPrice = itemDto.Quantity * itemDto.UnitPrice
                    };
                    sale.Items.Add(saleItem);
                }

                // Veresiye satışta müşteri borcunu güncelle
                if (saleDto.PaymentMethod == 2 && saleDto.CustomerId.HasValue)
                {
                    var customer = await _unitOfWork.Customers.GetByIdAsync(saleDto.CustomerId.Value);
                    if (customer != null)
                    {
                        customer.DebtBalance += saleDto.TotalAmount;
                        _unitOfWork.Customers.Update(customer);
                    }
                }

                await _unitOfWork.CompleteAsync();
                return "{\"success\": true}";
            }
            catch (Exception ex)
            {
                return $"{{\"success\": false, \"message\": \"{ex.Message}\"}}";
            }
        }

        public async Task<string> GetRecentSalesAsync()
        {
            // Simple logic: fetch all, sort descending. Pagination should be added for real production.
            var sales = await _unitOfWork.Sales.GetAllAsync();
            var dtos = sales.OrderByDescending(s => s.Date).Take(20).Select(s => new {
                Id = s.TransactionId.Substring(0, 8).ToUpper(),
                Date = s.Date.ToString("dd.MM.yyyy HH:mm"),
                Amount = s.TotalAmount,
                Status = "Tamamlandı" // Logic for cancelled/pending could be added
            });
            return System.Text.Json.JsonSerializer.Serialize(dtos);
        }

        public async Task<string> GetDashboardStatsAsync()
        {
            var today = DateTime.Today;
            var sales = await _unitOfWork.Sales.GetAllAsync();
            var dailySales = sales.Where(s => s.Date.Date == today).ToList();
            
            var stats = new
            {
                DailyTurnover = dailySales.Sum(s => s.TotalAmount),
                DailyTransactions = dailySales.Count,
                TotalStock = (await _unitOfWork.Products.GetAllAsync()).Sum(p => p.StockQuantity)
            };

            return System.Text.Json.JsonSerializer.Serialize(stats);
        }
    }
}
