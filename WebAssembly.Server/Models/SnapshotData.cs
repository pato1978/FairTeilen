using WebAssembly.Server.Enums;

namespace WebAssembly.Server.Models;



public class SnapshotData
{
    public decimal TotalExpenses { get; set; }
    public decimal SharedExpenses { get; set; }
    public decimal ChildExpenses { get; set; }

    public Dictionary<string, decimal> ExpensesByUser { get; set; } = new();
    public Dictionary<string, decimal> SharedByUser { get; set; } = new();
    public Dictionary<string, decimal> ChildByUser { get; set; } = new();
    public Dictionary<string, decimal> BalanceByUser { get; set; } = new();
    public Dictionary<ExpenseType, Dictionary<string, decimal>> ExpensesByTypeAndCategory { get; set; } = new();
    public List<string> RejectedByUser { get; set; } = new();
}