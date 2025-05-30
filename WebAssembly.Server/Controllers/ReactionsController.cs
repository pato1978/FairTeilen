
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
        // Prüfen, ob es schon eine Reaktion dieses Nutzers zur Ausgabe gibt
        var existing = await _db.ClarificationReactions
            .FirstOrDefaultAsync(r => r.ExpenseId == reaction.ExpenseId && r.UserId == reaction.UserId);

        if (existing != null)
        {
            // Alte Reaktion entfernen
            _db.ClarificationReactions.Remove(existing);
        }

        // Neue Reaktion hinzufügen
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

// 🔍 GET: Alle Reaktionen eines bestimmten Nutzers (optional, wenn du willst)
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<ClarificationReaction>>> GetReactionsByUser(string userId)
    {
        var reactions = await _db.ClarificationReactions
            .Where(r => r.UserId == userId)
            .ToListAsync();

        return Ok(reactions);
    }
   
}

