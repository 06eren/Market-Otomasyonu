using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Market_Otomasyonu.Models
{
    public class Category
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        public string Description { get; set; }

        // Navigation Property: A category can have many products
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
