
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;

using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services
{
    public class NotificationDispatcher
    {
        private readonly SharedDbContext _db;
        private readonly NotificationService _notifications;

        // 🔄 In-Memory-Cache pro Request: speichert alle AppUser pro Gruppe
        private readonly Dictionary<string, List<AppUser>> _userCache = new();

        public NotificationDispatcher(SharedDbContext db, NotificationService notifications)
        {
            _db = db;
            _notifications = notifications;
        }

        /// <summary>
        /// Holt **alle** Benutzer einer Gruppe und cached das Ergebnis
        /// </summary>
        private async Task<List<AppUser>> GetAllUsersInGroupAsync(string groupId)
        {
            if (_userCache.TryGetValue(groupId, out var cached))
                return cached;

            var users = await _db.Users
                                 .Where(u => u.GroupId == groupId)
                                 .ToListAsync();

            _userCache[groupId] = users;
            return users;
        }

        /// <summary>
        /// Benachrichtigt alle anderen Gruppenmitglieder, wenn eine Ausgabe erstellt oder bearbeitet wurde.
        /// </summary>
        public async Task NotifyUsersAboutExpenseAsync(Expense expense, bool isNew)
        {
            if (string.IsNullOrWhiteSpace(expense.GroupId))
                return; // Shared/Child ohne Gruppe überspringen

            // 1) Empfänger: alle Gruppenmitglieder außer dem Ersteller
            var recipients = (await GetAllUsersInGroupAsync(expense.GroupId!))
                             .Where(u => u.Id != expense.CreatedByUserId)
                             .ToList();

            // 2) Creator separat laden (kann außerhalb der Gruppe sein oder einen leeren DisplayName haben)
            var creator = await _db.Users.FindAsync(expense.CreatedByUserId);
            var creatorName = !string.IsNullOrWhiteSpace(creator?.DisplayName)
                ? creator.DisplayName
                : !string.IsNullOrWhiteSpace(creator?.Email)
                    ? creator.Email
                    : "Jemand";

            // 3) Textbausteine mit deutschem Datumsformat
            var verb = isNew ? "erstellt" : "bearbeitet";
            var actionDate = DateTime.UtcNow.AddHours(1); // CET/CEST
            var dateStr = actionDate.ToString("dd.MM.yyyy");
            var timeStr = actionDate.ToString("HH:mm");

            // 4) Notification erzeugen
            foreach (var user in recipients)
            {
                var notif = new Notification
                {
                    UserId    = user.Id,
                    GroupId   = expense.GroupId!,
                    ExpenseId = expense.Id,
                    ExpenseType = expense.Type,
                    MonthKey = expense.MonthKey,
                    Type      = isNew ? ActionType.Created : ActionType.Updated,
                    Message   = $"{creatorName} hat am {dateStr} um {timeStr} Uhr die Ausgabe {expense.Name} {verb}.",
                    ActionUrl = $"/expenses/{expense.Id}"
                };

                await _notifications.CreateNotificationAsync(notif);
            }
        }

        /// <summary>
        /// Benachrichtigt alle anderen Gruppenmitglieder, wenn eine Ausgabe gelöscht wurde.
        /// </summary>
        public async Task NotifyUsersAboutDeletedExpenseAsync(Expense expense)
        {
            if (string.IsNullOrWhiteSpace(expense.GroupId))
                return;

            // 1) Empfänger: alle außer dem Löschenden
            var recipients = (await GetAllUsersInGroupAsync(expense.GroupId!))
                             .Where(u => u.Id != expense.CreatedByUserId)
                             .ToList();

            // 2) Deleter separat laden
            var deleter = await _db.Users.FindAsync(expense.CreatedByUserId);
            var deleterName = !string.IsNullOrWhiteSpace(deleter?.DisplayName)
                ? deleter.DisplayName
                : !string.IsNullOrWhiteSpace(deleter?.Email)
                    ? deleter.Email
                    : "Jemand";

            // 3) Datum/Uhrzeit der Löschung (deutsches Format)
            var actionDate = DateTime.UtcNow.AddHours(1); // CET/CEST
            var dateStr = actionDate.ToString("dd.MM.yyyy");
            var timeStr = actionDate.ToString("HH:mm");

            // 4) Notification erzeugen
            foreach (var user in recipients)
            {
                var notif = new Notification
                {
                    UserId    = user.Id,
                    GroupId   = expense.GroupId!,
                    ExpenseId = expense.Id,
                    ExpenseType = expense.Type,
                    MonthKey = expense.MonthKey,
                    Type      = ActionType.Deleted,
                    Message   = $"{deleterName} hat am {dateStr} um {timeStr} Uhr die Ausgabe {expense.Name} gelöscht.",
                    ActionUrl = $"/expenses/{expense.Id}"
                };

                await _notifications.CreateNotificationAsync(notif);
            }
        }

        /// <summary>
        /// NEU: Benachrichtigt den Ersteller einer Ausgabe, wenn jemand sie beanstandet hat
        /// </summary>
        public async Task NotifyAboutRejectionAsync(string expenseId, string rejectingUserId, string groupId)
        {
            // 1) Lade die Ausgabe
            var expense = await _db.SharedExpenses.FindAsync(expenseId);
            if (expense == null || string.IsNullOrWhiteSpace(expense.CreatedByUserId))
                return;

            // 2) Lade den beanstandenden User
            var rejectingUser = await _db.Users.FindAsync(rejectingUserId);
            var rejectingUserName = !string.IsNullOrWhiteSpace(rejectingUser?.DisplayName)
                ? rejectingUser.DisplayName
                : !string.IsNullOrWhiteSpace(rejectingUser?.Email)
                    ? rejectingUser.Email
                    : "Jemand";

            // Datum und Zeit für die Nachricht
            var actionDate = DateTime.UtcNow.AddHours(1); // CET/CEST
            var dateStr = actionDate.ToString("dd.MM.yyyy");
            var timeStr = actionDate.ToString("HH:mm");

            // 3) Erstelle Notification für den Ersteller der Ausgabe
            var notification = new Notification
            {
                UserId = expense.CreatedByUserId,
                GroupId = groupId,
                ExpenseId = expenseId,
                ExpenseType = expense.Type,
                MonthKey = expense.MonthKey,
                Type = ActionType.Rejected,
                Message = $"{rejectingUserName} hat am {dateStr} um {timeStr} Uhr deine Ausgabe {expense.Name} beanstandet.",
                ActionUrl = $"/expenses/{expenseId}"
            };

            await _notifications.CreateNotificationAsync(notification);

            // 4) Optional: Benachrichtige auch alle anderen Gruppenmitglieder
            var otherUsers = (await GetAllUsersInGroupAsync(groupId))
                .Where(u => u.Id != expense.CreatedByUserId && u.Id != rejectingUserId)
                .ToList();

            foreach (var user in otherUsers)
            {
                var notif = new Notification
                {
                    UserId = user.Id,
                    GroupId = groupId,
                    ExpenseId = expenseId,
                    ExpenseType = expense.Type,
                    MonthKey = expense.MonthKey,
                    Type = ActionType.Rejected,
                    Message = $"{rejectingUserName} hat am {dateStr} um {timeStr} Uhr die Ausgabe {expense.Name} beanstandet.",
                    ActionUrl = $"/expenses/{expenseId}"
                };

                await _notifications.CreateNotificationAsync(notif);
            }
        }

        /// <summary>
        /// NEU: Benachrichtigt alle, wenn eine Beanstandung zurückgenommen wurde
        /// </summary>
        public async Task NotifyAboutRejectionWithdrawnAsync(string expenseId, string userId, string groupId)
        {
            // 1) Lade die Ausgabe
            var expense = await _db.SharedExpenses.FindAsync(expenseId);
            if (expense == null)
                return;

            // 2) Lade den User, der die Beanstandung zurücknimmt
            var withdrawingUser = await _db.Users.FindAsync(userId);
            var withdrawingUserName = !string.IsNullOrWhiteSpace(withdrawingUser?.DisplayName)
                ? withdrawingUser.DisplayName
                : !string.IsNullOrWhiteSpace(withdrawingUser?.Email)
                    ? withdrawingUser.Email
                    : "Jemand";

            // Datum und Zeit für die Nachricht
            var actionDate = DateTime.UtcNow.AddHours(1); // CET/CEST
            var dateStr = actionDate.ToString("dd.MM.yyyy");
            var timeStr = actionDate.ToString("HH:mm");

            // 3) Benachrichtige den Ersteller
            if (!string.IsNullOrWhiteSpace(expense.CreatedByUserId))
            {
                var notification = new Notification
                {
                    UserId = expense.CreatedByUserId,
                    GroupId = groupId,
                    ExpenseId = expenseId,
                    ExpenseType = expense.Type,
                    MonthKey = expense.MonthKey,
                    Type = ActionType.Confirmed,
                    Message = $"{withdrawingUserName} hat am {dateStr} um {timeStr} Uhr die Beanstandung für {expense.Name} zurückgenommen.",
                    ActionUrl = $"/expenses/{expenseId}"
                };

                await _notifications.CreateNotificationAsync(notification);
            }

            // 4) Benachrichtige andere Gruppenmitglieder
            var otherUsers = (await GetAllUsersInGroupAsync(groupId))
                .Where(u => u.Id != expense.CreatedByUserId && u.Id != userId)
                .ToList();

            foreach (var user in otherUsers)
            {
                var notif = new Notification
                {
                    UserId = user.Id,
                    GroupId = groupId,
                    ExpenseId = expenseId,
                    ExpenseType = expense.Type,
                    MonthKey = expense.MonthKey,
                    Type = ActionType.Confirmed,
                    Message = $"{withdrawingUserName} hat am {dateStr} um {timeStr} Uhr die Beanstandung für {expense.Name} zurückgenommen.",
                    ActionUrl = $"/expenses/{expenseId}"
                };

                await _notifications.CreateNotificationAsync(notif);
            }
        }
    }
}