
using WebAssembly.Server.Enums;

namespace WebAssembly.Server.Models;

public class ExpenseDto
{
    public string? Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Category { get; set; } = "";
  
    public ExpenseType Type { get; set; }
    public bool isRecurring { get; set; }
    public bool isBalanced { get; set; }
    
    

    public string? GroupId { get; set; }
    public string? createdByUserId { get; set; } // optional für später
}
