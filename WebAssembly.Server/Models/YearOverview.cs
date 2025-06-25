using System.ComponentModel.DataAnnotations.Schema;

namespace WebAssembly.Server.Models;

public class YearOverview
{    
    public int Id { get; set; } // ✅ Primärschlüssel hinzufügen

    public int Year { get; set; }
    [NotMapped]
    public List<MonthlyOverview> Months { get; set; }
}