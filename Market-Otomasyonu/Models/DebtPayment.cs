using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Market_Otomasyonu.Models
{
    public class DebtPayment
    {
        [Key]
        public int Id { get; set; }

        public int CustomerId { get; set; }
        public virtual Customer? Customer { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public string? Notes { get; set; }

        public DateTime Date { get; set; } = DateTime.Now;
    }
}
