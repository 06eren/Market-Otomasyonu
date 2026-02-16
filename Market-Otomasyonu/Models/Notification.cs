using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Market_Otomasyonu.Models;

public enum NotificationType
{
    LowStock = 0,
    DebtReminder = 1,
    SalaryDue = 2,
    System = 3
}

public class Notification
{
    [Key]
    public int Id { get; set; }

    public string Title { get; set; } = "";

    public string Message { get; set; } = "";

    public NotificationType Type { get; set; } = NotificationType.System;

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    /// <summary>Optional: related entity ID (e.g. product ID for low stock)</summary>
    public int? RelatedEntityId { get; set; }
}
