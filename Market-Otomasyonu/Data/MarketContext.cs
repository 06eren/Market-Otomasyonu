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
            // Seed initial data if necessary or configure relationships
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Gıda", Description = "Temel gıda ürünleri" },
                new Category { Id = 2, Name = "Temizlik", Description = "Temizlik malzemeleri" },
                new Category { Id = 3, Name = "Manav", Description = "Sebze ve meyve" }
            );
        }
    }
}
