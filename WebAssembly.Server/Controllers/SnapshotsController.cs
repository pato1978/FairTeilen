using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using WebAssembly.Server.Data;
using WebAssembly.Server.Enums;
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
        private readonly SharedDbContext _db;

        /// <summary>
        /// Konstruktor: Injiziert YearOverviewService zum Berechnen, SnapshotService zum Speichern und MailService zum Versenden.
        /// </summary>
        public SnapshotsController(
            YearOverviewService yearOverviewService,
            SnapshotService snapshotService,
            IMailService mailService,
            SharedDbContext db)
        {
            _yearOverviewService = yearOverviewService;
            _snapshotService = snapshotService;
            _mailService = mailService;
            _db = db;
        }

        // ============================================================================
        // 🔁 SNAPSHOT LÖSCHEN (Totals)
        // ============================================================================

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

        // ============================================================================
        // 📦 MONATLICHEN SNAPSHOT SPEICHERN (Totals + Full + Personal)
        // ============================================================================

        /// <summary>
        /// Erzeugt einen monatlichen Snapshot für eine Gruppe und benachrichtigt Beteiligte per E-Mail.
        /// Speichert:
        /// - Aggregierte Daten (SnapshotData)
        /// - Volle Ausgabenliste (FullSnapshotData)
        /// - Persönliche Ausgaben des aufrufenden Nutzers (PersonalSnapshotData)
        /// </summary>
        [HttpPost("{groupId}/{year:int}/{month:int}")]
        public async Task<IActionResult> SaveMonthlySnapshot(
            [FromRoute] string groupId,
            [FromRoute] int year,
            [FromRoute] int month)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();

            try
            {
                // 🔐 Echte User-ID holen (Login vorausgesetzt)
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                             ?? throw new UnauthorizedAccessException("Kein Nutzer eingeloggt");

                var monthKey = $"{year:D4}-{month:D2}";

                // 1) Übersicht berechnen (aus allen Ausgaben)
                var overview = await _yearOverviewService
                    .GetOverviewForMonthAsync(year, month, userId, groupId);

                // 2) SnapshotData (Totals) erstellen
                var snapshotData = new SnapshotData
                {
                    TotalExpenses = overview.Total,
                    SharedExpenses = overview.Shared,
                    ChildExpenses = overview.Child,
                    ExpensesByUser = overview.TotalByUser,
                    SharedByUser = overview.SharedByUser,
                    ChildByUser = overview.ChildByUser,
                    BalanceByUser = overview.BalanceByUser,
                    RejectedByUser = overview.RejectionsByUser?.Keys.ToList() ?? new(),
                    ExpensesByTypeAndCategory = overview.Expenses!
                        .GroupBy(e => e.Type)
                        .ToDictionary(
                            typeGroup => typeGroup.Key,
                            typeGroup => typeGroup
                                .GroupBy(e => e.Category ?? "Unbekannt")
                                .ToDictionary(
                                    catGroup => catGroup.Key,
                                    catGroup => catGroup.Sum(e => e.Amount)
                                )
                        )
                };

                // 3) FullSnapshotData mit Einzelausgaben (shared + child)
                var fullSnapshot = new FullSnapshotData
                {
                    TotalExpenses = snapshotData.TotalExpenses,
                    SharedExpenses = snapshotData.SharedExpenses,
                    ChildExpenses = snapshotData.ChildExpenses,
                    ExpensesByUser = snapshotData.ExpensesByUser,
                    SharedByUser = snapshotData.SharedByUser,
                    ChildByUser = snapshotData.ChildByUser,
                    BalanceByUser = snapshotData.BalanceByUser,
                    RejectedByUser = snapshotData.RejectedByUser,
                    ExpensesByTypeAndCategory = snapshotData.ExpensesByTypeAndCategory,
                    SharedAndChildExpenses = overview.Expenses!
                        .Where(e => e.Type == ExpenseType.Shared || e.Type == ExpenseType.Child)
                        .ToList()
                };

                // 4) Persönlicher Snapshot (nur eigene Personal-Ausgaben)
                var personalSnapshot = new PersonalSnapshotData
                {
                    UserId = userId,
                    GroupId = groupId,
                    MonthKey = monthKey,
                    PersonalExpenses = overview.Expenses!
                        .Where(e => e.Type == ExpenseType.Personal && e.CreatedByUserId == userId)
                        .ToList()
                };

                // 5) Speichern aller Snapshots
                await _snapshotService.SaveSnapshotAsync(groupId, monthKey, snapshotData);           // totals
                await _snapshotService.SaveFullSnapshotAsync(groupId, monthKey, fullSnapshot);       // full
                await _snapshotService.SavePersonalSnapshotAsync(personalSnapshot);                  // personal

                // 6) Commit Transaktion
                await transaction.CommitAsync();

                // 7) E-Mail versenden
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
                        subject: $"Monatsabrechnung ({year}-{month:D2})",
                        htmlBody: mailBody
                    );
                }

                return NoContent(); // Erfolg: 204
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(); // Im Fehlerfall zurückrollen
                throw;
            }
            
            
        }
        /// <summary>
        /// Liefert den aggregierten Snapshot (Totals) für eine Gruppe.
        /// Enthält Summen, Verteilungen und Kategorie-Auswertung (ohne Einzel-Ausgaben).
        /// </summary>
        [HttpGet("{groupId}/{year:int}/{month:int}")]
        public async Task<IActionResult> GetSnapshotTotals(string groupId, int year, int month)
        {
            var monthKey = $"{year:D4}-{month:D2}";

            var snapshot = await _snapshotService.LoadSnapshotAsync(groupId, monthKey);

            if (snapshot == null)
                return NotFound(); // Kein Snapshot vorhanden

            return Ok(snapshot); // 200 + JSON: SnapshotData
        }
        /// <summary>
        /// Liefert den vollständigen Snapshot mit allen Einzelausgaben (shared + child) für eine Gruppe.
        /// Ideal für Detailansicht, Export, Premium-Funktionen.
        /// </summary>
        [HttpGet("{groupId}/{year:int}/{month:int}/full")]
        public async Task<IActionResult> GetFullSnapshot(string groupId, int year, int month)
        {
            var monthKey = $"{year:D4}-{month:D2}";

            var fullSnapshot = await _snapshotService.LoadFullSnapshotAsync(groupId, monthKey);

            if (fullSnapshot == null)
                return NotFound(); // Kein FullSnapshot gespeichert

            return Ok(fullSnapshot); // 200 + JSON: FullSnapshotData
        }
        
        /// <summary>
        /// Liefert den persönlichen Snapshot (nur eigene Personal-Ausgaben) für den aktuell angemeldeten Nutzer.
        /// Andere Nutzer haben darauf keinen Zugriff.
        /// </summary>
        [HttpGet("personal/{year:int}/{month:int}")]
        public async Task<IActionResult> GetPersonalSnapshot(int year, int month)
        {
            // 🔐 Sicherstellen, dass ein Nutzer eingeloggt ist
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var monthKey = $"{year:D4}-{month:D2}";

            var personal = await _snapshotService.GetPersonalSnapshotAsync(userId, monthKey);

            if (personal == null)
                return NotFound(); // Kein persönlicher Snapshot vorhanden

            return Ok(personal); // 200 + JSON: PersonalSnapshotData
        }


    }
    
}
