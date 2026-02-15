using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Market_Otomasyonu.Models
{
    public enum PaymentMethod
    {
        Cash,
        CreditCard,
        Debit, // Veresiye
        Split
    }

    public class Sale
    {
        [Key]
        public int Id { get; set; }

        public string TransactionId { get; set; } = Guid.NewGuid().ToString();

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; } // Final total after discounts/tax

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; }

        public PaymentMethod PaymentMethod { get; set; }

        public int? CustomerId { get; set; }
        public virtual Customer? Customer { get; set; }

        public DateTime Date { get; set; } = DateTime.Now;

        public virtual ICollection<SaleItem> Items { get; set; } = new List<SaleItem>();
    }
}
