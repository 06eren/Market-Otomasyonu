using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Market_Otomasyonu.Models
{
    public class SalaryPayment
    {
        [Key]
        public int Id { get; set; }

        public int EmployeeId { get; set; }
        public virtual Employee? Employee { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrossSalary { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal NetSalary { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxDeduction { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal SgkDeduction { get; set; }

        [MaxLength(7)]
        public string Period { get; set; } = string.Empty; // "2026-02"

        public DateTime PaidAt { get; set; } = DateTime.Now;

        public string? Notes { get; set; }
    }
}
