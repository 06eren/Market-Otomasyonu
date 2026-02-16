using System;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Market_Otomasyonu.Models;

namespace Market_Otomasyonu.Services
{
    [ComVisible(true)]
    public class CustomerService
    {
        private static Data.IUnitOfWork CreateUnitOfWork()
        {
            return new Data.UnitOfWork(new Data.MarketContext());
        }

        public async Task<string> GetCustomersJsonAsync()
        {
            using var uow = CreateUnitOfWork();
            var customers = await uow.Customers.GetAllAsync();
            var dtos = customers.Select(c => new
            {
                c.Id,
                c.FullName,
                c.PhoneNumber,
                c.Email,
                c.LoyaltyPoints,
                c.DebtBalance,
                CreatedAt = c.CreatedAt.ToString("dd.MM.yyyy")
            });
            return System.Text.Json.JsonSerializer.Serialize(dtos);
        }

        private static string? ValidateCustomer(string fullName, string? phone, string? email)
        {
            if (string.IsNullOrWhiteSpace(fullName) || fullName.Trim().Length < 3)
                return "Ad Soyad en az 3 karakter olmalıdır.";

            if (!string.IsNullOrWhiteSpace(phone))
            {
                var cleaned = Regex.Replace(phone, @"[\s\-\(\)]", "");
                if (!Regex.IsMatch(cleaned, @"^(0?5\d{9}|\+?90\d{10})$") && cleaned.Length < 7)
                    return "Geçerli bir telefon numarası girin (05XX XXX XX XX).";
            }

            if (!string.IsNullOrWhiteSpace(email) && !Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                return "Geçerli bir e-posta adresi girin.";

            return null;
        }

        public async Task<string> AddCustomerAsync(string json)
        {
            try
            {
                using var uow = CreateUnitOfWork();
                var customer = System.Text.Json.JsonSerializer.Deserialize<Customer>(json);
                if (customer == null) return "{\"success\":false,\"message\":\"Geçersiz veri\"}";

                var err = ValidateCustomer(customer.FullName, customer.PhoneNumber, customer.Email);
                if (err != null) return System.Text.Json.JsonSerializer.Serialize(new { success = false, message = err });

                customer.FullName = customer.FullName.Trim();
                customer.CreatedAt = DateTime.Now;
                customer.DebtBalance = 0;

                await uow.Customers.AddAsync(customer);
                await uow.CompleteAsync();
                return "{\"success\":true}";
            }
            catch (Exception ex)
            {
                return System.Text.Json.JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public async Task<string> UpdateCustomerAsync(string json)
        {
            try
            {
                using var uow = CreateUnitOfWork();
                var dto = System.Text.Json.JsonSerializer.Deserialize<Customer>(json);
                if (dto == null) return "{\"success\":false,\"message\":\"Geçersiz veri\"}";

                var customer = await uow.Customers.GetByIdAsync(dto.Id);
                if (customer == null) return "{\"success\":false,\"message\":\"Müşteri bulunamadı\"}";

                var err = ValidateCustomer(dto.FullName, dto.PhoneNumber, dto.Email);
                if (err != null) return System.Text.Json.JsonSerializer.Serialize(new { success = false, message = err });

                customer.FullName = dto.FullName.Trim();
                customer.PhoneNumber = dto.PhoneNumber;
                customer.Email = dto.Email;

                uow.Customers.Update(customer);
                await uow.CompleteAsync();
                return "{\"success\":true}";
            }
            catch (Exception ex)
            {
                return System.Text.Json.JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public async Task<string> PayDebtAsync(string json)
        {
            try
            {
                using var uow = CreateUnitOfWork();
                var data = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(json);
                var customerId = data.GetProperty("CustomerId").GetInt32();
                var amount = data.GetProperty("Amount").GetDecimal();

                if (amount <= 0) return "{\"success\":false,\"message\":\"Ödeme tutarı sıfırdan büyük olmalı.\"}";

                var customer = await uow.Customers.GetByIdAsync(customerId);
                if (customer == null) return "{\"success\":false,\"message\":\"Müşteri bulunamadı.\"}";

                if (amount > customer.DebtBalance)
                    return "{\"success\":false,\"message\":\"Ödeme tutarı borç bakiyesinden büyük olamaz.\"}";

                customer.DebtBalance -= amount;
                uow.Customers.Update(customer);
                await uow.CompleteAsync();

                return System.Text.Json.JsonSerializer.Serialize(new { success = true, message = $"₺{amount:F2} ödeme alındı. Kalan borç: ₺{customer.DebtBalance:F2}", remainingDebt = customer.DebtBalance });
            }
            catch (Exception ex)
            {
                return System.Text.Json.JsonSerializer.Serialize(new { success = false, message = ex.Message });
            }
        }

        public async Task<string> DeleteCustomerAsync(int id)
        {
            using var uow = CreateUnitOfWork();
            var customer = await uow.Customers.GetByIdAsync(id);
            if (customer == null) return "{\"success\":false,\"message\":\"Müşteri bulunamadı\"}";

            if (customer.DebtBalance > 0)
                return System.Text.Json.JsonSerializer.Serialize(new { success = false, message = $"Borcu olan müşteri silinemez. Borç: ₺{customer.DebtBalance:F2}" });

            uow.Customers.Remove(customer);
            await uow.CompleteAsync();
            return "{\"success\":true}";
        }
    }
}
