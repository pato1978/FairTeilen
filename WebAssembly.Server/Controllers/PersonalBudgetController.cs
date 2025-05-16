using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Controllers;

[ApiController]
[Route("api/budget")]
public class BudgetController : ControllerBase
{
    private readonly AppDbContext _appDb;
    private readonly SharedDbContext _sharedDb;

    public BudgetController(AppDbContext appDb, SharedDbContext sharedDb)
    {
        _appDb = appDb;
        _sharedDb = sharedDb;
    }

    [HttpGet]
    public async Task<IActionResult> GetBudget(
        [FromQuery] string scope,
        [FromQuery] string month
    )
    {
        if (scope == "null") scope = null;
        if (month == "null") month = null;

        if (string.IsNullOrWhiteSpace(scope) || string.IsNullOrWhiteSpace(month))
            return BadRequest("Scope und Month sind erforderlich");

        var db = GetDbContext(scope);
        var entry = await EnsureBudgetEntry(db, scope, month);
        return Ok(entry.Amount);
    }

    [HttpPut]
    public async Task<IActionResult> PutBudget([FromBody] BudgetEntry input)
    {
        if (input.Scope == "null") input.Scope = null;
        if (input.Month == "null") input.Month = null;

        if (string.IsNullOrWhiteSpace(input.Scope) || string.IsNullOrWhiteSpace(input.Month))
            return BadRequest("Scope und Month sind erforderlich");

        var db = GetDbContext(input.Scope);

        var existing = await db.Set<BudgetEntry>()
            .FirstOrDefaultAsync(b => b.Month == input.Month && b.Scope == input.Scope);

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

    private async Task<BudgetEntry> EnsureBudgetEntry(DbContext db, string scope, string month)
    {
        var entry = await db.Set<BudgetEntry>()
            .FirstOrDefaultAsync(b => b.Month == month && b.Scope == scope);
        if (entry != null)
            return entry;

        DateTime monthParsed = DateTime.ParseExact(month, "yyyy-MM", null);
        var previousMonth = monthParsed.AddMonths(-1);
        var entryLastMonth = await db.Set<BudgetEntry>()
            .FirstOrDefaultAsync(b => b.Month == previousMonth.ToString("yyyy-MM") && b.Scope == scope);

        entry = new BudgetEntry
        {
            Amount = entryLastMonth?.Amount ?? 0,
            Month = month,
            Scope = scope
        };

        db.Set<BudgetEntry>().Add(entry);
        await db.SaveChangesAsync();

        return entry;
    }

    private DbContext GetDbContext(string scope)
    {
        return scope switch
        {
            "personal" => _appDb,
            "shared" or "child" => _sharedDb,
            _ => throw new ArgumentException($"Ungültiger scope: {scope}")
        };
    }
}
