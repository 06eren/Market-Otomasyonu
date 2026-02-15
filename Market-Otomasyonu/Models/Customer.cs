using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Market_Otomasyonu.Models
{
    public class Customer
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; }

        [MaxLength(20)]
        public string PhoneNumber { get; set; }

        public string Email { get; set; }

        public int LoyaltyPoints { get; set; }

        // Veresiye Defteri (Debt Balance)
        [Column(TypeName = "decimal(18,2)")]
        public decimal DebtBalance { get; set; }

        public virtual ICollection<Sale> Sales { get; set; } = new List<Sale>();

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
