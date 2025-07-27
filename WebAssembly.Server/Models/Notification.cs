using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace WebAssembly.Server.Models;

public enum ActionType
{
    Created,
    Updated,
    Deleted,
    Confirmed,
    Rejected
}

public class Notification
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [Required]
    public string UserId { get; set; } = string.Empty;
    [Required]
    public string GroupId { get; set; } = string.Empty;
    public string? ExpenseId { get; set; }
    [Required]
    [Column(TypeName = "nvarchar(20)")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ActionType Type { get; set; }
    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ActionUrl { get; set; }
}
