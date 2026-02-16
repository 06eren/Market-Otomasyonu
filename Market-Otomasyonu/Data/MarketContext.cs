using Microsoft.EntityFrameworkCore;
using Market_Otomasyonu.Models;
using System.IO;
using System;

namespace Market_Otomasyonu.Data
{
    public class MarketContext : DbContext
    {
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Sale> Sales { get; set; }
        public DbSet<SaleItem> SaleItems { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            var folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MarketOtomasyonu");
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }
            var dbPath = Path.Combine(folder, "market.db");
            optionsBuilder.UseSqlite($"Data Source={dbPath}");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Gıda", Description = "Temel gıda ürünleri" },
                new Category { Id = 2, Name = "Temizlik", Description = "Temizlik malzemeleri" },
                new Category { Id = 3, Name = "Manav", Description = "Sebze ve meyve" }
            );

            // Default admin user (password: "admin123")
            modelBuilder.Entity<Employee>().HasData(
                new Employee
                {
                    Id = 1,
                    Username = "admin",
                    PasswordHash = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", // SHA256("admin123")
                    FullName = "Sistem Yöneticisi",
                    Role = EmployeeRole.Admin,
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1)
                }
            );

            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.Username)
                .IsUnique();
        }
    }
}
