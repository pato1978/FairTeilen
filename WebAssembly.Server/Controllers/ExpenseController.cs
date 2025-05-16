using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpensesController : ControllerBase
    {
        // 🔌 Zwei verschiedene DbContexts: einer für lokale persönliche Ausgaben (SQLite),
        // der andere für zentrale geteilte/Kind-Ausgaben (MSSQL)
        private readonly AppDbContext _appDb;
        private readonly SharedDbContext _sharedDb;

        public ExpensesController(AppDbContext appDb, SharedDbContext sharedDb)
        {
            _appDb = appDb;
            _sharedDb = sharedDb;
        }

        // -----------------------------------------------------------------------
        // 📥 Universeller GET-Endpunkt
        // Liefert Ausgaben abhängig vom Scope (personal/shared/child)
        // Optional mit Monatsfilter und Gruppen-ID
        // Beispiel: GET /api/expenses?scope=shared&group=xyz&month=2025-05
        // -----------------------------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetExpenses(
            [FromQuery] string scope,
            [FromQuery] string? group,
            [FromQuery] string? month)
        {   
            if (group == "null") group = null;
            // 🔒 1. Scope-Validierung
            if (string.IsNullOrWhiteSpace(scope))
                return BadRequest("Parameter 'scope' ist erforderlich.");

            // 📅 2. Monat in Datumsbereich umwandeln (z. B. 2025-05 → 01.05.–01.06.)
            if (!DateTime.TryParse($"{month}-01", out var monthStart))
                return BadRequest("Ungültiges Datumsformat. Erwartet wird 'YYYY-MM'.");

            var monthEnd = monthStart.AddMonths(1);

            // 🔍 3. Je nach Scope den passenden DbContext und Filter wählen
            IQueryable<Expense> query = scope switch
            {
                "personal" => _appDb.Expenses
                    .Where(e => e.isPersonal && !e.isShared && !e.isChild),

                "shared" => _sharedDb.SharedExpenses
                    .Where(e => e.isShared && (string.IsNullOrWhiteSpace(group) || e.GroupId == group)),

                "child" => _sharedDb.SharedExpenses
                    .Where(e => e.isChild),

                _ => throw new ArgumentException($"Unbekannter scope: {scope}")
            };

            // 📆 4. Monatsfilter anwenden
            query = query.Where(e => e.Date >= monthStart && e.Date < monthEnd);

            // 🧾 5. Sortierung und Rückgabe
            var result = await query.OrderByDescending(e => e.Date).ToListAsync();
            return Ok(result);
        }

        // -----------------------------------------------------------------------
        // 💾 Universeller POST-Endpunkt zum Speichern oder Aktualisieren von Ausgaben
        // Entscheidet anhand des Scopes, ob SQLite oder MSSQL verwendet wird
        // -----------------------------------------------------------------------
        [HttpPost]
        public async Task<IActionResult> SaveExpense([FromBody] ExpenseDto dto)
        {
            // 📆 Monatsschlüssel und Jahreswert setzen
            var monthKey = dto.Date.ToString("yyyy-MM");
            var yearKey = dto.Date.Year.ToString();

            // 🆕 Neue ID erzeugen oder bestehende übernehmen
            var isNew = string.IsNullOrWhiteSpace(dto.Id);
            var expenseId = isNew ? Guid.NewGuid().ToString() : dto.Id;

            // 🏗️ Neues Expense-Objekt aufbauen
            var expense = new Expense
            {
                Id = expenseId,
                Name = dto.Name,
                Amount = dto.Amount,
                Date = dto.Date,
                MonthKey = monthKey,
                YearKey = yearKey,
                Category = dto.Category,
                isPersonal = dto.isPersonal,
                isChild = dto.isChild,
                isShared = dto.isShared,
                isRecurring = dto.isRecurring,
                isBalanced = dto.isBalanced,
                GroupId = dto.GroupId,
                CreatedByUserId = dto.CreatedByUserId
            };

            // 🧠 Zielkontext wählen (lokal oder zentral)
            var context = dto.isShared || dto.isChild ? (DbContext)_sharedDb : _appDb;

            // 🔁 Falls vorhanden: alte Ausgabe löschen (Upsert-Verhalten)
            if (!isNew)
            {
                var existing = await context.Set<Expense>().FirstOrDefaultAsync(e => e.Id == expense.Id);
                if (existing != null)
                {
                    context.Remove(existing);
                }
            }

            // 💾 Speichern
            await context.AddAsync(expense);
            await context.SaveChangesAsync();

            return Ok(expense);
        }

        // -----------------------------------------------------------------------
        // 🗑️ DELETE: /api/expenses/{id}
        // Entfernt eine Ausgabe aus beiden Kontexten (wird im ersten gefundenen gelöscht)
        // -----------------------------------------------------------------------
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpense(string id)
        {
            // 🔍 1. Suche in lokaler DB
            var expense = await _appDb.Expenses.FirstOrDefaultAsync(e => e.Id == id);
            if (expense != null)
            {
                _appDb.Expenses.Remove(expense);
                await _appDb.SaveChangesAsync();
                return NoContent();
            }

            // 🔍 2. Suche in zentraler DB
            expense = await _sharedDb.SharedExpenses.FirstOrDefaultAsync(e => e.Id == id);
            if (expense != null)
            {
                _sharedDb.SharedExpenses.Remove(expense);
                await _sharedDb.SaveChangesAsync();
                return NoContent();
            }

            // ❌ Nicht gefunden
            return NotFound();
        }
    }
}
