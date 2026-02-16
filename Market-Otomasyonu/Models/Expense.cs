using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Market_Otomasyonu.Models
{
    public enum ExpenseCategory
    {
        Rent,        // Kira
        Electricity, // Elektrik
        Water,       // Su
        Gas,         // Doğalgaz
        Internet,    // İnternet/Telefon
        Salary,      // Personel maaşı
        Supplier,    // Tedarikçi ödemesi
        Tax,         // Vergi ödemesi
        Insurance,   // Sigorta
        Maintenance, // Bakım/Onarım
        Transport,   // Nakliye/Ulaşım
        Other        // Diğer
    }

    public class Expense
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public ExpenseCategory Category { get; set; } = ExpenseCategory.Other;

        public DateTime Date { get; set; } = DateTime.Now;

        public int? EmployeeId { get; set; }
        public virtual Employee? Employee { get; set; }

        public string? Notes { get; set; }

        public bool IsRecurring { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
