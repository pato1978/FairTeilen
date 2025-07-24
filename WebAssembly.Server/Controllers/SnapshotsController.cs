using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using WebAssembly.Server.Data;
using WebAssembly.Server.Helpers;
using WebAssembly.Server.Models;
using WebAssembly.Server.Services;

namespace WebAssembly.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SnapshotsController : ControllerBase
    {
        private readonly YearOverviewService _yearOverviewService;
        private readonly SnapshotService _snapshotService;
        private readonly IMailService _mailService;
        private readonly SharedDbContext _db; // 🔧 NEU: Für Transaktionen

        /// <summary>
        /// Konstruktor: Injiziert YearOverviewService zum Berechnen, SnapshotService zum Speichern und MailService zum Versenden.
        /// </summary>
        public SnapshotsController(
            YearOverviewService yearOverviewService,
            SnapshotService snapshotService,
            IMailService mailService,
            SharedDbContext db) // 🔧 NEU
        {
            _yearOverviewService = yearOverviewService;
            _snapshotService = snapshotService;
            _mailService = mailService;
            _db = db;
        }
        
        [HttpDelete("{groupId}/{year:int}/{month:int}")]
        public async Task<IActionResult> DeleteSnapshot(
            [FromRoute] string groupId,
            [FromRoute] int year,
            [FromRoute] int month)
        {
            var monthKey = $"{year:D4}-{month:D2}";
            var success = await _snapshotService.DeleteSnapshotAsync(groupId, monthKey);

            if (!success)
                return NotFound(); // 404, wenn kein Snapshot vorhanden war

            return NoContent(); // 204, wenn erfolgreich gelöscht
        }
        
        /// <summary>
        /// Erzeugt einen monatlichen Snapshot für eine Gruppe und benachrichtigt Beteiligte per E-Mail.
        /// </summary>
        /// <param name="groupId">ID der Gruppe</param>
        /// <param name="year">Jahreszahl (YYYY)</param>
        /// <param name="month">Monatszahl (1-12)</param>
        [HttpPost("{groupId}/{year:int}/{month:int}")]
        public async Task<IActionResult> SaveMonthlySnapshot(
            [FromRoute] string groupId,
            [FromRoute] int year,
            [FromRoute] int month)
        {
            // 🔧 NEU: Transaktion starten
            using var transaction = await _db.Database.BeginTransactionAsync();
            
            try
            {
                // User-ID aus Claims holen, sonst 401
                // var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                //            ?? throw new UnauthorizedAccessException();
                // 🧪 Temporär: feste User-ID
                var userId = "local-dev-user";
                
                // 1) Jahresübersicht berechnen
                var overview = await _yearOverviewService
                    .GetOverviewForMonthAsync(year, month, userId, groupId);

                // 2) SnapshotData auf Basis der Übersicht erstellen
                var snapshotData = new SnapshotData
                {
                    TotalExpenses = overview.Total,
                    SharedExpenses = overview.Shared,
                    ChildExpenses = overview.Child,
                    ExpensesByUser = overview.TotalByUser,
                    SharedByUser = overview.SharedByUser,
                    ChildByUser = overview.ChildByUser,
                    BalanceByUser = overview.BalanceByUser,
                    RejectedByUser = overview.RejectionsByUser?.Keys.ToList() ?? new List<string>(),
                    // 3) 🆕 Neue verschachtelte Statistik nach Typ & Kategorie berechnen
                    ExpensesByTypeAndCategory = overview.Expenses!
                    .GroupBy(e => e.Type)
                    .ToDictionary(
                    typeGroup => typeGroup.Key,
                    typeGroup => typeGroup
                            .GroupBy(e => e.Category ?? 
                                          "Unbekannt")
                            .ToDictionary(
                                catGroup => catGroup.Key,
                                catGroup => catGroup.Sum(e => e.Amount)
                            )
                        )
                };
                
                // 3) Snapshot speichern (Verhindert Duplikate intern)
                var monthKey = $"{year:D4}-{month:D2}";
                await _snapshotService.SaveSnapshotAsync(groupId, monthKey, snapshotData);

                // 🔧 NEU: Transaktion committen
                await transaction.CommitAsync();
                
                // 4) E-Mail-Benachrichtigung an Beteiligte (NACH dem Commit!)
                var recipients = new[]
                {
                    "pveglia@gmx.de",
                    "m.p.siuda@gmail.com"
                };

                var mailBody = MailTemplates.BuildSnapshotMail(groupId, year, month, snapshotData);

                foreach (var recipient in recipients)
                {
                    await _mailService.SendEmailAsync(
                        to: recipient,
                        subject: "Monatsabrechnung "+$"({year}-{month:D2})",
                        htmlBody: mailBody
                    );
                }

                // 204 No Content bei Erfolg
                return NoContent();
            }
            catch (Exception)
            {
                // 🔧 NEU: Bei Fehler Rollback
                await transaction.RollbackAsync();
                throw; // Fehler weiterwerfen
            }
        }
    }
}