using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading.Tasks;
using Market_Otomasyonu.Models;
using Microsoft.EntityFrameworkCore;
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
        private static Data.IUnitOfWork CreateUnitOfWork()
        {
            return new Data.UnitOfWork(new Data.MarketContext());
        }

        public async Task<string> ProcessSaleAsync(string saleJson)
        {
            try
            {
                using var uow = CreateUnitOfWork();
                var saleDto = JsonSerializer.Deserialize<SaleDto>(saleJson);
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

                await uow.Sales.AddAsync(sale);

                foreach (var itemDto in saleDto.Items)
                {
                    var product = await uow.Products.GetByIdAsync(itemDto.ProductId);
                    if (product == null) throw new Exception($"Ürün bulunamadı: {itemDto.ProductId}");

                    if (product.StockQuantity < itemDto.Quantity)
                        throw new Exception($"Yetersiz stok: {product.Name}");

                    product.StockQuantity -= itemDto.Quantity;
                    uow.Products.Update(product);

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
                    var customer = await uow.Customers.GetByIdAsync(saleDto.CustomerId.Value);
                    if (customer != null)
                    {
                        customer.DebtBalance += saleDto.TotalAmount;
                        uow.Customers.Update(customer);
                    }
                }

                await uow.CompleteAsync();
                return JsonSerializer.Serialize(new { success = true });
            }
            catch (Exception ex)
            {
                return JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public async Task<string> GetRecentSalesAsync()
        {
            using var uow = CreateUnitOfWork();
            var dtos = await uow.Sales.Query()
                .OrderByDescending(s => s.Date)
                .Take(20)
                .Select(s => new {
                    Id = s.TransactionId.Substring(0, 8).ToUpper(),
                    Date = s.Date.ToString("dd.MM.yyyy HH:mm"),
                    Amount = s.TotalAmount,
                    Status = "Tamamlandı"
                })
                .ToListAsync();
            return JsonSerializer.Serialize(dtos);
        }

        public async Task<string> GetDashboardStatsAsync()
        {
            using var uow = CreateUnitOfWork();
            var today = DateTime.Today;

            var dailySales = await uow.Sales.Query()
                .Where(s => s.Date.Date == today)
                .ToListAsync();
            
            var totalStock = await uow.Products.Query()
                .SumAsync(p => p.StockQuantity);

            var stats = new
            {
                DailyTurnover = dailySales.Sum(s => s.TotalAmount),
                DailyTransactions = dailySales.Count,
                TotalStock = totalStock
            };

            return JsonSerializer.Serialize(stats);
        }
    }
}
