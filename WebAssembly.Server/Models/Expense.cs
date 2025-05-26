namespace WebAssembly.Server.Models;

public class Expense
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? GroupId { get; set; } // darf null sein
    public string? CreatedByUserId { get; set; }
    //public User? CreatedByUser { get; set; } // falls du ein User-Modell hast
 
    
    
    public string Name { get; set; } = "";
    
    public decimal Amount { get; set; } = 0; // z. B. "€42.50"// wdadawdadwdadwdr6turhdawgit commit -m "Testcommit für Hook"
    public DateTime Date { get; set; } 
    public string MonthKey { get; set; } = "";
    public string YearKey { get; set; } = "";
    public string Category { get; set; } = "";
    
    public bool isPersonal { get; set; }
    public bool isChild { get; set; }
    public bool isShared { get; set; }
    public bool isRecurring { get; set; }
    public bool isBalanced { get; set; }
    public bool isAccepted { get; set; }
}