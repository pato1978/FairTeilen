using WebAssembly.Server.Enums;

public class Expense
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? GroupId { get; set; }
    public string? CreatedByUserId { get; set; }

    public string Name { get; set; } = "";
    public decimal Amount { get; set; } = 0;
    public DateTime Date { get; set; }
    public string MonthKey { get; set; } = "";
    public string YearKey { get; set; } = "";
    public string Category { get; set; } = "";

    // ✅ Ersetze die drei Booleans durch eine Enum:
    public ExpenseType Type { get; set; } 

    public bool isRecurring { get; set; }
    public bool isBalanced { get; set; }
}