namespace WebAssembly.Server.Models;

public class BudgetEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Month { get; set; } = ""; // Format: "2025-05"
    public decimal Amount { get; set; }
    public string Scope { get; set; } = ""; // "personal", "shared", "child", etc.
    // 🔑 Benutzerbindung hinzufügen:
    public string UserId { get; set; } = "";
    public string? GroupId { get; set; }
    //public User? User { get; set; } // Navigation Property (optional)
}