using System.Globalization;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Enums;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

public class YearOverviewService
{
    private readonly SharedDbContext _sharedDb;
    private readonly SnapshotService _snapshotService;
    
    public YearOverviewService(SharedDbContext sharedDb, SnapshotService snapshotService)
    {
        _sharedDb = sharedDb;
        _snapshotService = snapshotService;
    }

    /// <summary>
    /// Berechnet die Übersicht für ein gesamtes Jahr – 12 Monate.
    /// </summary>
    public async Task<YearOverview> GetOverviewForYearAsync(int year, string userId, string groupId)
    {
        var overview = new YearOverview
        {
            Year = year,
            Months = new List<MonthlyOverview>()
        };

        for (int month = 1; month <= 12; month++)
        {   
            var monthly = await GetOverviewForMonthAsync(year, month, userId, groupId);
            overview.Months.Add(monthly);
        }

        return overview;
    }

    /// <summary>
    /// Berechnet die Monatsübersicht für einen bestimmten Monat und eine Gruppe.
    /// </summary>
    public async Task<MonthlyOverview> GetOverviewForMonthAsync(int year, int month, string userId, string groupId)
    {
        var monthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month);
        var monthKey = $"{year:D4}-{month:D2}";
        var yearKey = $"{year}";

        Console.WriteLine($"[DEBUG] GetOverviewForMonthAsync - Start für {monthKey}");

        var today = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
        var reference = new DateTime(year, month, 1);
        
        // Prüfe ob Snapshot existiert
        var snapshot = await _snapshotService.LoadSnapshotAsync(groupId, monthKey);
        if (snapshot != null)
        {
            Console.WriteLine($"[DEBUG] Snapshot gefunden für {monthKey}");
            return new MonthlyOverview()
            {
                Id = $"{groupId}_{monthKey}",
                GroupId = groupId,
                MonthKey = monthKey,
                YearKey = yearKey,
                Name = monthName,
                Status = "completed",
                Total = snapshot.TotalExpenses,
                Shared = snapshot.SharedExpenses,
                Child = snapshot.ChildExpenses,
                TotalByUser = snapshot.ExpensesByUser,
                SharedByUser = snapshot.SharedByUser,
                ChildByUser = snapshot.ChildByUser,
                BalanceByUser = snapshot.BalanceByUser,
                RejectionsByUser = snapshot.RejectedByUser?.ToDictionary(id => id, id => true) ?? new Dictionary<string, bool>()
            };
        }
        else
        {
            // 🔹 Ausgaben des Monats laden
            var monthStart = new DateTime(year, month, 1);
            var monthEnd = monthStart.AddMonths(1);
            
            var expenses = await _sharedDb.SharedExpenses
                .Where(e => e.Date >= monthStart && e.Date < monthEnd && !e.isBalanced && e.CreatedByUserId != null)
                .ToListAsync();
                
            Console.WriteLine($"[DEBUG] {monthKey}: {expenses.Count} Ausgaben gefunden");

            // 🔹 IDs der Ausgaben für diesen Monat
            var expenseIdsInMonth = expenses.Select(e => e.Id).ToList();

            // 🔹 KORREKT: Reaktionen basierend auf den Ausgaben des Monats laden
            var reactions = await _sharedDb.ClarificationReactions
                .Where(r => expenseIdsInMonth.Contains(r.ExpenseId))
                .ToListAsync();
                
            Console.WriteLine($"[DEBUG] {monthKey}: {reactions.Count} Reaktionen zu Ausgaben dieses Monats gefunden");
            
            // Debug: Details zu gefundenen Reaktionen
            foreach (var reaction in reactions)
            {
                var expense = expenses.FirstOrDefault(e => e.Id == reaction.ExpenseId);
                Console.WriteLine($"[DEBUG] {monthKey}: Reaktion {reaction.Id} - ExpenseId: {reaction.ExpenseId} ({expense?.Name ?? "NICHT GEFUNDEN"}), UserId: {reaction.UserId}, Status: {reaction.Status}");
            }

            // 🔸 Gruppieren nach Typ
            var shared = expenses.Where(e => e.Type == ExpenseType.Shared).ToList();
            var child = expenses.Where(e => e.Type == ExpenseType.Child).ToList();

            var totalShared = shared.Sum(e => e.Amount);
            var totalChild = child.Sum(e => e.Amount);

            var sharedByUser = shared
                .GroupBy(e => e.CreatedByUserId!)
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

            var childByUser = child
                .GroupBy(e => e.CreatedByUserId!)
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

            // 🔸 Gesamt je User
            var totalByUser = new Dictionary<string, decimal>();
            foreach (var kv in sharedByUser)
                totalByUser[kv.Key] = kv.Value;
            foreach (var kv in childByUser)
            {
                if (!totalByUser.ContainsKey(kv.Key))
                    totalByUser[kv.Key] = 0;
                totalByUser[kv.Key] += kv.Value;
            }

            // 🔸 Saldenberechnung
            var balanceByUser = totalByUser.ToDictionary(
                u => u.Key,
                u => totalByUser[u.Key] - totalByUser.Where(kvp => kvp.Key != u.Key).Sum(kvp => kvp.Value)
            );

            // 🔸 Rejected-Reaktionen extrahieren
            var rejected = reactions
                .Where(r => r.Status == ClarificationStatus.Rejected)
                .GroupBy(r => r.UserId)
                .ToDictionary(g => g.Key, g => true);
                
            Console.WriteLine($"[DEBUG] {monthKey}: {rejected.Count} User haben Rejected-Status");

            // 🔸 Status bestimmen
            string status;

            // WICHTIG: Klärungsbedarf hat IMMER höchste Priorität!
            if (rejected.Any())
            {
                status = "needs-clarification";
            }
            else if (reference > today)
            {
                status = "future";
            }
            else if (reference < today)
            {
                // Vergangene Monate
                if (expenses.Count == 0)
                {
                    status = "notTakenIntoAccount";
                }
                else
                {
                    status = "past";
                }
            }
            else
            {
                // reference == today (aktueller Monat)
                status = "pending";
            }
            
            Console.WriteLine($"[DEBUG] {monthKey}: Finaler Status = {status}");

            // 🔁 Monatsobjekt zusammenbauen
            return new MonthlyOverview
            {
                Id = $"{groupId}_{monthKey}",
                GroupId = groupId,
                MonthKey = monthKey,
                YearKey = yearKey,
                Name = monthName,
                Status = status,
                Total = totalShared + totalChild,
                Shared = totalShared,
                Child = totalChild,
                SharedByUser = sharedByUser,
                ChildByUser = childByUser,
                TotalByUser = totalByUser,
                BalanceByUser = balanceByUser,
                RejectionsByUser = rejected
            };
        }
    }
}