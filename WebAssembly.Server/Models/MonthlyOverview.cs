using System.ComponentModel.DataAnnotations.Schema;

public class MonthlyOverview
{
    public int MonthId { get; set; }
    public string Name { get; set; }
    public string Status { get; set; }

    public decimal Total { get; set; }
    public decimal Shared { get; set; }
    public decimal Child { get; set; }
    public decimal Balance { get; set; }

    // 🔄 Neu: strukturierte User-Zuordnung

    [NotMapped] public Dictionary<string, decimal> SharedByUser { get; set; } = new();

    [NotMapped] public Dictionary<string, decimal> ChildByUser { get; set; } = new();

    [NotMapped] public Dictionary<string, decimal> TotalByUser { get; set; } = new();

    [NotMapped] public Dictionary<string, decimal> BalanceByUser { get; set; } = new();

    [NotMapped] public Dictionary<string, bool> RejectionsByUser { get; set; } = new();
}