using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Market_Otomasyonu.Models
{
    public class ActivityLog
    {
        [Key]
        public int Id { get; set; }

        public int EmployeeId { get; set; }

        [ForeignKey("EmployeeId")]
        public Employee? Employee { get; set; }

        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty; // LOGIN, LOGOUT, SALE, STOCK_UPDATE, PRICE_CHANGE, etc.

        [MaxLength(500)]
        public string Detail { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
