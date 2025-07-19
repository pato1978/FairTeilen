using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using WebAssembly.Server.Services;
using WebAssembly.Server.ViewModel;

namespace WebAssembly.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SnapshotsController : ControllerBase
    {
        private readonly YearOverviewService _yearOverviewService;
        private readonly SnapshotService _snapshotService;
        private readonly IMailService _mailService;

        /// <summary>
        /// Konstruktor: Injiziert YearOverviewService zum Berechnen, SnapshotService zum Speichern und MailService zum Versenden.
        /// </summary>
        public SnapshotsController(
            YearOverviewService yearOverviewService,
            SnapshotService snapshotService,
            IMailService mailService)
        {
            _yearOverviewService = yearOverviewService;
            _snapshotService = snapshotService;
            _mailService = mailService;
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
                RejectedByUser = overview.RejectionsByUser?.Keys.ToList() ?? new List<string>()
            };

            // 3) Snapshot speichern (Verhindert Duplikate intern)
            var monthKey = $"{year:D4}-{month:D2}";
            await _snapshotService.SaveSnapshotAsync(groupId, monthKey, snapshotData);

            // 4) E-Mail-Benachrichtigung an Beteiligte
            var recipients = new[]
            {
                "pveglia@gmx.de",
                "m.p.siuda@gmail.com"
            };

            var subject = $"📦 Snapshot für {year}-{month:D2} erstellt";
            var htmlBody = $@"
                <h2>Snapshot gespeichert</h2>
                <p>Der Snapshot für die Gruppe <strong>{groupId}</strong>
                wurde am <strong>{DateTime.Now:dd.MM.yyyy HH:mm}</strong> erfolgreich gespeichert.</p>
                <p>Er ist nun im System archiviert.</p>
                <hr>
                <p style='font-size: 12px; color: gray;'>Share2Gether – Automatische Benachrichtigung</p>
            ";

            foreach (var recipient in recipients)
            {
                await _mailService.SendEmailAsync(
                    to: recipient,
                    subject: subject,
                    htmlBody: htmlBody
                );
            }

            // 204 No Content bei Erfolg
            return NoContent();
        }
    }
}
