using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReactionsController : ControllerBase
{
    private readonly SharedDbContext _db;

    public ReactionsController(SharedDbContext db)
    {
        _db = db;
    }

    // ✅ POST: Neue Reaktion speichern oder ersetzen
    [HttpPost]
    public async Task<IActionResult> PostReaction([FromBody] ClarificationReaction reaction)
    {
        var existing = await _db.ClarificationReactions
            .FirstOrDefaultAsync(r => r.ExpenseId == reaction.ExpenseId && r.UserId == reaction.UserId);

        if (existing != null)
        {
            _db.ClarificationReactions.Remove(existing);
        }

        _db.ClarificationReactions.Add(reaction);
        await _db.SaveChangesAsync();

        return Ok(reaction);
    }

    // ❌ DELETE: Reaktion eines Users zu einer Ausgabe löschen
    [HttpDelete("{expenseId}/{userId}")]
    public async Task<IActionResult> DeleteReaction(string expenseId, string userId)
    {
        var reaction = await _db.ClarificationReactions
            .FirstOrDefaultAsync(r => r.ExpenseId == expenseId && r.UserId == userId);

        if (reaction == null)
            return NotFound();

        _db.ClarificationReactions.Remove(reaction);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // 🔍 GET: Alle Reaktionen zu einer bestimmten Ausgabe
    [HttpGet("expense/{expenseId}")]
    public async Task<ActionResult<List<ClarificationReaction>>> GetReactionsForExpense(string expenseId)
    {
        var reactions = await _db.ClarificationReactions
            .Where(r => r.ExpenseId == expenseId)
            .ToListAsync();

        return Ok(reactions);
    }

    // 🔍 GET: Alle Reaktionen für einen bestimmten Monat (Format: yyyy-MM)
    [HttpGet("month/{monthId}")]
    public async Task<ActionResult<List<ClarificationReaction>>> GetReactionsByMonth(string monthId)
    {
        if (!DateTime.TryParse($"{monthId}-01", out var firstOfMonth))
            return BadRequest("Invalid month format. Use YYYY-MM.");

        var nextMonth = firstOfMonth.AddMonths(1);

        var reactions = await _db.ClarificationReactions
            .Include(r => r.Expense) // 🔁 Wichtig: Expense-Datum abrufen
            .Where(r => r.Expense.Date >= firstOfMonth && r.Expense.Date < nextMonth)
            .ToListAsync();

        return Ok(reactions);
    }

    // (Optional: GET aller Reaktionen eines Nutzers – kannst du jetzt löschen, wenn nicht mehr gebraucht)
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<ClarificationReaction>>> GetReactionsByUser(string userId)
    {
        var reactions = await _db.ClarificationReactions
            .Where(r => r.UserId == userId)
            .ToListAsync();

        return Ok(reactions);
    }
}
