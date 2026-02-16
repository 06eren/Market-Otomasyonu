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
        private readonly Data.IUnitOfWork _unitOfWork;

        public CustomerService()
        {
            var context = new Data.MarketContext();
            _unitOfWork = new Data.UnitOfWork(context);
        }

        public async Task<string> GetCustomersJsonAsync()
        {
            var customers = await _unitOfWork.Customers.GetAllAsync();
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
                var customer = System.Text.Json.JsonSerializer.Deserialize<Customer>(json);
                if (customer == null) return "{\"success\":false,\"message\":\"Geçersiz veri\"}";

                var err = ValidateCustomer(customer.FullName, customer.PhoneNumber, customer.Email);
                if (err != null) return $"{{\"success\":false,\"message\":\"{err}\"}}";

                customer.FullName = customer.FullName.Trim();
                customer.CreatedAt = DateTime.Now;
                customer.DebtBalance = 0;

                await _unitOfWork.Customers.AddAsync(customer);
                await _unitOfWork.CompleteAsync();
                return "{\"success\":true}";
            }
            catch (Exception ex)
            {
                return $"{{\"success\":false,\"message\":\"{ex.Message}\"}}";
            }
        }

        public async Task<string> UpdateCustomerAsync(string json)
        {
            try
            {
                var dto = System.Text.Json.JsonSerializer.Deserialize<Customer>(json);
                if (dto == null) return "{\"success\":false,\"message\":\"Geçersiz veri\"}";

                var customer = await _unitOfWork.Customers.GetByIdAsync(dto.Id);
                if (customer == null) return "{\"success\":false,\"message\":\"Müşteri bulunamadı\"}";

                var err = ValidateCustomer(dto.FullName, dto.PhoneNumber, dto.Email);
                if (err != null) return $"{{\"success\":false,\"message\":\"{err}\"}}";

                customer.FullName = dto.FullName.Trim();
                customer.PhoneNumber = dto.PhoneNumber;
                customer.Email = dto.Email;

                _unitOfWork.Customers.Update(customer);
                await _unitOfWork.CompleteAsync();
                return "{\"success\":true}";
            }
            catch (Exception ex)
            {
                return $"{{\"success\":false,\"message\":\"{ex.Message}\"}}";
            }
        }

        public async Task<string> PayDebtAsync(string json)
        {
            try
            {
                var data = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(json);
                var customerId = data.GetProperty("CustomerId").GetInt32();
                var amount = data.GetProperty("Amount").GetDecimal();

                if (amount <= 0) return "{\"success\":false,\"message\":\"Ödeme tutarı sıfırdan büyük olmalı.\"}";

                var customer = await _unitOfWork.Customers.GetByIdAsync(customerId);
                if (customer == null) return "{\"success\":false,\"message\":\"Müşteri bulunamadı.\"}";

                if (amount > customer.DebtBalance)
                    return "{\"success\":false,\"message\":\"Ödeme tutarı borç bakiyesinden büyük olamaz.\"}";

                customer.DebtBalance -= amount;
                _unitOfWork.Customers.Update(customer);
                await _unitOfWork.CompleteAsync();

                return $"{{\"success\":true,\"message\":\"₺{amount:F2} ödeme alındı. Kalan borç: ₺{customer.DebtBalance:F2}\",\"remainingDebt\":{customer.DebtBalance}}}";
            }
            catch (Exception ex)
            {
                return $"{{\"success\":false,\"message\":\"{ex.Message}\"}}";
            }
        }

        public async Task<string> DeleteCustomerAsync(int id)
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(id);
            if (customer == null) return "{\"success\":false,\"message\":\"Müşteri bulunamadı\"}";

            if (customer.DebtBalance > 0)
                return $"{{\"success\":false,\"message\":\"Borcu olan müşteri silinemez. Borç: ₺{customer.DebtBalance:F2}\"}}";

            _unitOfWork.Customers.Remove(customer);
            await _unitOfWork.CompleteAsync();
            return "{\"success\":true}";
        }
    }
}
