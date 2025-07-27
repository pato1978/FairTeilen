using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Enums;
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

            // 3) Textbausteine
            var verb        = isNew ? "erstellt" : "bearbeitet";
            var actionDate  = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm");

            // 4) Notification erzeugen
            foreach (var user in recipients)
            {
                var notif = new Notification
                {
                    UserId    = user.Id,
                    GroupId   = expense.GroupId!,
                    ExpenseId = expense.Id,
                    ExpenseType = expense.Type, // ✅ NEU
                    MonthKey = expense.MonthKey,
                    Type      = isNew ? ActionType.Created : ActionType.Updated,
                    Message   = $"{creatorName} hat die Ausgabe „{expense.Name}“ am {actionDate} {verb}.",
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

            // 3) Datum/Uhrzeit der Löschung
            var actionDate = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm");

            // 4) Notification erzeugen
            foreach (var user in recipients)
            {
                var notif = new Notification
                {
                    UserId    = user.Id,
                    GroupId   = expense.GroupId!,
                    ExpenseId = expense.Id,
                    ExpenseType = expense.Type, // ✅ NEU
                    MonthKey = expense.MonthKey,
                    Type      = ActionType.Deleted,
                    Message   = $"{deleterName} hat die Ausgabe „{expense.Name}“ am {actionDate} gelöscht.",
                    ActionUrl = $"/expenses/{expense.Id}"
                };

                await _notifications.CreateNotificationAsync(notif);
            }
        }
    }
}
