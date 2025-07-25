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
            // 🔒 Validierung: alle Parameter müssen gesetzt und sinnvoll sein
            if (string.IsNullOrWhiteSpace(scope) || scope == "null" ||
                string.IsNullOrWhiteSpace(month) || month == "null" ||
                string.IsNullOrWhiteSpace(userId) || userId == "null" ||
                string.IsNullOrWhiteSpace(groupId) || groupId == "null")
            {
                return BadRequest("❌ Ungültige oder fehlende Parameter: scope, month, userId, groupId sind erforderlich.");
            }

            var db = GetDbContext(scope);

            var entry = await EnsureBudgetEntry(db, scope, month, userId, groupId);

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
            // 🔒 Validierung: alle Pflichtfelder müssen gesetzt und sinnvoll sein
            if (string.IsNullOrWhiteSpace(input.Scope) || input.Scope == "null" ||
                string.IsNullOrWhiteSpace(input.Month) || input.Month == "null" ||
                string.IsNullOrWhiteSpace(input.UserId) || input.UserId == "null" ||
                string.IsNullOrWhiteSpace(input.GroupId) || input.GroupId == "null")
            {
                return BadRequest("❌ Ungültige oder fehlende Felder: scope, month, userId, groupId sind erforderlich.");
            }

            var db = GetDbContext(input.Scope);

            // 🔁 Update oder Insert
            var existing = await db.Set<BudgetEntry>().FirstOrDefaultAsync(b =>
                b.Month == input.Month &&
                b.Scope == input.Scope &&
                b.UserId == input.UserId &&
                b.GroupId == input.GroupId);

            if (existing != null)
            {
                existing.Amount = input.Amount;
            }
            else
            {
                input.Id = Guid.NewGuid();
                db.Set<BudgetEntry>().Add(input);
            }

            await db.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Fehler beim Speichern des Budgets für {Scope} {Month} {UserId}", input.Scope, input.Month, input.UserId);
            return StatusCode(500, $"Fehler beim Speichern des Budgets: {ex.Message}");
        }
    }


    private async Task<BudgetEntry> EnsureBudgetEntry(DbContext db, string scope, string month, string userId,string groupId)
    {
        var entry = await db.Set<BudgetEntry>().FirstOrDefaultAsync(b =>
            b.Month == month && b.Scope == scope && b.UserId == userId && b.GroupId == groupId);


        if (entry != null)
            return entry;

        if (!DateTime.TryParseExact(month, "yyyy-MM", null, System.Globalization.DateTimeStyles.None, out var monthParsed))
            throw new FormatException("Ungültiges Datumsformat");

        var previousMonth = monthParsed.AddMonths(-1).ToString("yyyy-MM");

        var entryLastMonth = await db.Set<BudgetEntry>()
            .FirstOrDefaultAsync(b => b.Month == previousMonth && b.Scope == scope && b.UserId == userId);

        entry = new BudgetEntry
        {
            Id = Guid.NewGuid(),
            Amount = entryLastMonth?.Amount ?? 0,
            Month = month,
            Scope = scope,
            UserId = userId,
            GroupId = groupId // Falls benötigt, sonst entfernen
        };

        db.Set<BudgetEntry>().Add(entry);
        await db.SaveChangesAsync();

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
