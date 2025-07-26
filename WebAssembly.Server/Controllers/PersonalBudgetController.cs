using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Controllers;

[ApiController]
[Route("api/budget")]
public class BudgetController : ControllerBase
{
    private readonly SharedDbContext _sharedDb;
    private readonly ILogger<BudgetController> _logger;

    public BudgetController(SharedDbContext sharedDb, ILogger<BudgetController> logger)
    {
        _sharedDb = sharedDb;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetBudget(
        [FromQuery] string? scope,
        [FromQuery] string? month,
        [FromQuery] string? userId,
        [FromQuery] string? groupId
    )
    {
        try
        {
            // ✅ Grundvalidierung: scope, month, userId sind immer erforderlich
            if (string.IsNullOrWhiteSpace(scope) || scope == "null" ||
                string.IsNullOrWhiteSpace(month) || month == "null" ||
                string.IsNullOrWhiteSpace(userId) || userId == "null")
            {
                return BadRequest("❌ Ungültige oder fehlende Parameter: scope, month, userId sind erforderlich.");
            }

            // ✅ GroupId-Validierung: nur für shared/child erforderlich
            if ((scope == "shared" || scope == "child") && 
                (string.IsNullOrWhiteSpace(groupId) || groupId == "null"))
            {
                return BadRequest("❌ GroupId ist erforderlich für shared/child Budgets.");
            }

            // ✅ Für personal scope groupId auf leeren String setzen
            var effectiveGroupId = scope == "personal" ? "" : groupId;

            var db = GetDbContext(scope);
            var entry = await EnsureBudgetEntry(db, scope, month, userId, effectiveGroupId);

            // ✅ Logging: Zeige ob es sich um gemeinsames oder persönliches Budget handelt
            var budgetType = (scope == "shared" || scope == "child") ? "gemeinsames" : "persönliches";
            Console.WriteLine($"✅ {budgetType} Budget geladen: {entry.Amount} für {scope}/{month}/{userId}");
            
            return Ok(entry.Amount);
        }
        catch (FormatException fe)
        {
            _logger.LogError(fe, "❌ Ungültiges Datumsformat für Monat: {Month}", month);
            return BadRequest("Ungültiges Monatsformat. Erwartet: yyyy-MM");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Fehler beim Abrufen des Budgets für {Scope} {Month} {UserId}", scope, month, userId);
            return StatusCode(500, $"Interner Fehler: {ex.Message}");
        }
    }

   
    [HttpPut]
    public async Task<IActionResult> PutBudget([FromBody] BudgetEntry input)
    {
        try
        {
            // ✅ Grundvalidierung: scope, month, userId sind immer erforderlich
            if (string.IsNullOrWhiteSpace(input.Scope) || input.Scope == "null" ||
                string.IsNullOrWhiteSpace(input.Month) || input.Month == "null" ||
                string.IsNullOrWhiteSpace(input.UserId) || input.UserId == "null")
            {
                return BadRequest("❌ Ungültige oder fehlende Felder: scope, month, userId sind erforderlich.");
            }

            // ✅ GroupId-Validierung: nur für shared/child erforderlich
            if ((input.Scope == "shared" || input.Scope == "child") && 
                (string.IsNullOrWhiteSpace(input.GroupId) || input.GroupId == "null"))
            {
                return BadRequest("❌ GroupId ist erforderlich für shared/child Budgets.");
            }

            // ✅ Für personal scope groupId auf leeren String setzen
            if (input.Scope == "personal")
            {
                input.GroupId = "";
            }

            var db = GetDbContext(input.Scope);

            // ✅ WICHTIG: Für shared/child suchen wir nach dem Budget für die GRUPPE
            // Das bedeutet: userId ist bereits vom Frontend als "group-{groupId}" formatiert
            var existing = await db.Set<BudgetEntry>().FirstOrDefaultAsync(b =>
                b.Month == input.Month &&
                b.Scope == input.Scope &&
                b.UserId == input.UserId && // Für shared/child ist das "group-{groupId}"
                b.GroupId == input.GroupId);

            var budgetType = (input.Scope == "shared" || input.Scope == "child") ? "gemeinsames" : "persönliches";

            if (existing != null)
            {
                var oldAmount = existing.Amount;
                existing.Amount = input.Amount;
                Console.WriteLine($"✅ {budgetType} Budget aktualisiert: {oldAmount} → {input.Amount} für {input.Scope}/{input.Month}");
            }
            else
            {
                input.Id = Guid.NewGuid();
                db.Set<BudgetEntry>().Add(input);
                Console.WriteLine($"✅ {budgetType} Budget erstellt: {input.Amount} für {input.Scope}/{input.Month}");
            }

            await db.SaveChangesAsync();
            
            // ✅ HINWEIS: Bei shared/child Budgets werden alle User in der Gruppe das gleiche Budget sehen
            if (input.Scope == "shared" || input.Scope == "child")
            {
                Console.WriteLine($"💡 Alle User in Gruppe {input.GroupId} sehen jetzt das {budgetType} Budget: {input.Amount}");
            }
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Fehler beim Speichern des Budgets für {Scope} {Month} {UserId}", input.Scope, input.Month, input.UserId);
            return StatusCode(500, $"Fehler beim Speichern des Budgets: {ex.Message}");
        }
    }


    private async Task<BudgetEntry> EnsureBudgetEntry(DbContext db, string scope, string month, string userId, string groupId)
    {
        // ✅ Suche nach existierendem Budget-Eintrag
        var entry = await db.Set<BudgetEntry>().FirstOrDefaultAsync(b =>
            b.Month == month && b.Scope == scope && b.UserId == userId && b.GroupId == groupId);

        if (entry != null)
            return entry;

        // ✅ Validierung des Datumsformats
        if (!DateTime.TryParseExact(month, "yyyy-MM", null, System.Globalization.DateTimeStyles.None, out var monthParsed))
            throw new FormatException("Ungültiges Datumsformat");

        var previousMonth = monthParsed.AddMonths(-1).ToString("yyyy-MM");

        // ✅ Suche Budget vom Vormonat (für shared/child ist userId bereits "group-{groupId}")
        var entryLastMonth = await db.Set<BudgetEntry>()
            .FirstOrDefaultAsync(b => b.Month == previousMonth && b.Scope == scope && b.UserId == userId && b.GroupId == groupId);

        // ✅ Erstelle neuen Budget-Eintrag
        entry = new BudgetEntry
        {
            Id = Guid.NewGuid(),
            Amount = entryLastMonth?.Amount ?? 0, // Übernehme Betrag vom Vormonat oder 0
            Month = month,
            Scope = scope,
            UserId = userId, // Für shared/child ist das "group-{groupId}"
            GroupId = groupId ?? ""
        };

        db.Set<BudgetEntry>().Add(entry);
        await db.SaveChangesAsync();

        // ✅ Logging für bessere Nachverfolgung
        var budgetType = (scope == "shared" || scope == "child") ? "gemeinsames" : "persönliches";
        var inheritedInfo = entryLastMonth != null ? $"von Vormonat übernommen ({entryLastMonth.Amount})" : "als Standard (0)";
        Console.WriteLine($"✅ Neues {budgetType} Budget erstellt: {entry.Amount} für {scope}/{month} ({inheritedInfo})");
        
        return entry;
    }

    private DbContext GetDbContext(string scope)
    {
        return scope switch
        {
            "personal" => _sharedDb,
            "shared" or "child" => _sharedDb,
            _ => throw new ArgumentException($"Ungültiger scope: {scope}")
        };
    }
}