using System;
using System.Linq;
using System.Runtime.InteropServices;
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

        public async Task<string> AddCustomerAsync(string json)
        {
            try
            {
                var customer = System.Text.Json.JsonSerializer.Deserialize<Customer>(json);
                if (customer == null) return "{\"success\":false,\"message\":\"Geçersiz veri\"}";

                if (string.IsNullOrWhiteSpace(customer.FullName))
                    return "{\"success\":false,\"message\":\"Ad Soyad zorunludur.\"}";

                customer.CreatedAt = DateTime.Now;
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

                customer.FullName = dto.FullName;
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

        public async Task<string> DeleteCustomerAsync(int id)
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(id);
            if (customer == null) return "{\"success\":false,\"message\":\"Müşteri bulunamadı\"}";

            _unitOfWork.Customers.Remove(customer);
            await _unitOfWork.CompleteAsync();
            return "{\"success\":true}";
        }
    }
}
