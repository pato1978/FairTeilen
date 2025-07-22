using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class MonthlyOverview
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string GroupId { get; set; } = "";
    public string MonthKey { get; set; } = ""; // "2025-07"
    public string YearKey { get; set; } = "";  // "2025" ✅ NEU

    public string Name { get; set; } = "";
    public string Status { get; set; } = "open";

    public decimal Total { get; set; }
    public decimal Shared { get; set; }
    public decimal Child { get; set; }
    public decimal Balance { get; set; }
    
    public List<Expense>? Expenses { get; set; } // NEU

    [NotMapped] public Dictionary<string, decimal> SharedByUser { get; set; } = new();
    [NotMapped] public Dictionary<string, decimal> ChildByUser { get; set; } = new();
    [NotMapped] public Dictionary<string, decimal> TotalByUser { get; set; } = new();
    [NotMapped] public Dictionary<string, decimal> BalanceByUser { get; set; } = new();
    [NotMapped] public Dictionary<string, bool> RejectionsByUser { get; set; } = new();
    [NotMapped]
    public Dictionary<string, bool> ConfirmationsByUser { get; set; } = new();
}