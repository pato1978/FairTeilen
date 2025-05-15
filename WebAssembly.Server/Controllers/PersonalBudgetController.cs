using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Controllers;

// 📦 Universeller Budget-Controller für alle Scopes: "personal", "shared", "child"
[ApiController]
[Route("api/budget")]
public class BudgetController : ControllerBase
{
    private readonly AppDbContext _appDb;           // 👉 Lokale SQLite-Datenbank für persönliche Budgets
    private readonly SharedDbContext _sharedDb;     // 👉 Zentrale MSSQL-Datenbank für geteilte und Kinder-Budgets

    // 💉 Konstruktor: Beide Kontexte werden über Dependency Injection bereitgestellt
    public BudgetController(AppDbContext appDb, SharedDbContext sharedDb)
    {
        _appDb = appDb;
        _sharedDb = sharedDb;
    }

    // 📥 GET /api/budget?scope=shared&month=2025-05
    // 🔍 Holt den Budgetwert für einen bestimmten Scope (Bereich) und Monat
    [HttpGet]
    public async Task<IActionResult> GetBudget(
        [FromQuery] string scope,   // z. B. "personal", "shared", "child"
        [FromQuery] string month    // z. B. "2025-05"
    )
    {
        // 🛡️ Eingabeprüfung: Beide Parameter sind erforderlich
        if (string.IsNullOrWhiteSpace(scope) || string.IsNullOrWhiteSpace(month))
            return BadRequest("Scope und Month sind erforderlich");

        // 🧠 Ermitteln, welcher DbContext (App oder Shared) verwendet werden soll
        var db = GetDbContext(scope);

        
        
        var entry = await EnsureBudgetEntry(db, scope, month);
        return Ok(entry.Amount);
    }

    // 💾 PUT /api/budget
    // 🛠 Speichert oder aktualisiert ein Budget für einen bestimmten Scope und Monat
    [HttpPut]
    public async Task<IActionResult> PutBudget(
        [FromBody] BudgetEntry input // JSON-Eingabe vom Client
    )
    {
        // 🛡️ Scope und Month müssen gesetzt sein
        if (string.IsNullOrWhiteSpace(input.Scope) || string.IsNullOrWhiteSpace(input.Month))
            return BadRequest("Scope und Month sind erforderlich");

        // 🔍 Wähle wieder den passenden Datenbankkontext
        var db = GetDbContext(input.Scope);

        // 🔁 Prüfe, ob bereits ein Eintrag für diesen Monat + Scope existiert
        var existing = await db.Set<BudgetEntry>()
            .FirstOrDefaultAsync(b => b.Month == input.Month && b.Scope == input.Scope);

        if (existing != null)
        {
            // ✏️ Budget aktualisieren, wenn vorhanden
            existing.Amount = input.Amount;
        }
        else
        {
            // ➕ Neu erstellen, wenn noch kein Eintrag existiert
            input.Id = Guid.NewGuid(); // Neue GUID vergeben (falls nicht vorhanden)
            db.Set<BudgetEntry>().Add(input); // Eintrag hinzufügen
        }

        // 💾 Änderungen in der Datenbank speichern
        await db.SaveChangesAsync();

        // ✅ Erfolgreich, kein Rückgabeobjekt notwendig
        return NoContent(); // HTTP 204
    }

    private async Task<BudgetEntry> EnsureBudgetEntry(DbContext db, string scope, string month)
    {   var entry = await db.Set<BudgetEntry>()
            .FirstOrDefaultAsync(b => b.Month == month && b.Scope == scope);
        if (entry != null)
            return entry;
        DateTime monthParsed =DateTime.ParseExact(month, "yyyy-MM", null);
        var previousMonth =monthParsed.AddMonths(-1); 
        var entryLastMonth = await db.Set<BudgetEntry>().FirstOrDefaultAsync(b => b.Month == previousMonth.ToString("yyyy-MM") && b.Scope == scope);
       
        entry= new BudgetEntry()
        {
            Amount = entryLastMonth?.Amount ?? 0 , Month = month, Scope = scope
        };
        db.Set<BudgetEntry>().Add(entry);
        await db.SaveChangesAsync();

        return entry;
    }
    // 🧠 Hilfsmethode: Wählt basierend auf dem scope den richtigen DbContext
    private DbContext GetDbContext(string scope)
    {
        return scope switch
        {
            "personal" => _appDb,               // ➡️ Lokale Datenbank (SQLite)
            "shared" or "child" => _sharedDb,   // ➡️ Zentrale Datenbank (MSSQL)
            _ => throw new ArgumentException($"Ungültiger scope: {scope}") // ❌ Eingabe ungültig
        };
    }
}
