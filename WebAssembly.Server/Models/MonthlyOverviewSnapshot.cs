using System.ComponentModel.DataAnnotations;

namespace WebAssembly.Server.Models;

public class MonthlyOverviewSnapshot
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public string GroupId { get; set; } = string.Empty;

    public string Month { get; set; } = string.Empty; // z. B. "2025-06"

    public string Status { get; set; } = "completed"; // optional: "completed", "archived", ...

    public string SnapshotJson { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}