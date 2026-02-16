using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Market_Otomasyonu.Models
{
    public enum EmployeeRole
    {
        Admin = 0,
        Manager = 1,
        Cashier = 2
    }

    public class Employee
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        public EmployeeRole Role { get; set; } = EmployeeRole.Cashier;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? LastLoginAt { get; set; }

        public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
    }
}
