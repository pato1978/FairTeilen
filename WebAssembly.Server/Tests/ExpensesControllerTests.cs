using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Controllers;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;
using Xunit;

// Hinweis zu DateTime.Today:
// Die Methode `CopyRecurringSharedExpenses` nutzt direkt DateTime.Today. Für deterministische Tests
// wäre es ideal, DateTime.Today per Interface (z.B. IDateTimeProvider) zu kapseln. Diese Tests
// verwenden _runDate = DateTime.Today zur Laufzeit. Das reicht, um die Kernlogik zu verifizieren,
// macht aber gezielte Datumstests (z.B. Jahreswechsel) schwerer.

namespace WebAssembly.Server.Tests
{
    public class ExpensesControllerTests : IDisposable
    {
        private readonly SharedDbContext _context;
        private readonly ExpensesController _controller;
        private readonly DateTime _runDate; // Für konsistente "Heute"-Berechnung in den Tests

        public ExpensesControllerTests()
        {
            _runDate = DateTime.Today; // Könnte festgelegt werden, um tests an spezifischen Tagen zu simulieren

            var options = new DbContextOptionsBuilder<SharedDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Jede Testinstanz eigene DB
                .Options;
            _context = new SharedDbContext(options);

            // AppDbContext wird von CopyRecurringSharedExpenses nicht genutzt, aber benötigt für den Controller-Konstruktor
            var appDbOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var appDbContext = new AppDbContext(appDbOptions);

            _controller = new ExpensesController(appDbContext, _context);
        }

        [Fact]
        public async Task CopyRecurringSharedExpenses_NoExpensesCopiedYet_CopiesPreviousMonthExpenses()
        {
            // Arrange: Vormonats-Datum und Monatsanfang berechnen
            var previousMonth = _runDate.AddMonths(-1);
            var currentMonthStart = new DateTime(_runDate.Year, _runDate.Month, 1);

            // Wiederkehrende Shared-Ausgabe aus Mai
            var recurringExpense1 = new Expense
            {
                Id = "prev_shared_recurring1",
                Name = "Shared Rent",
                Amount = 1200,
                Date = new DateTime(previousMonth.Year, previousMonth.Month, 15),
                MonthKey = previousMonth.ToString("yyyy-MM"),
                YearKey = previousMonth.Year.ToString(),
                Category = "Housing",
                isRecurring = true,
                isShared = true,
                isChild = false,
                GroupId = "group1",
                CreatedByUserId = "user1"
            };

            // Wiederkehrende Child-Ausgabe aus Mai
            var recurringExpense2 = new Expense
            {
                Id = "prev_child_recurring1",
                Name = "Child Support",
                Amount = 300,
                Date = new DateTime(previousMonth.Year, previousMonth.Month, 5),
                MonthKey = previousMonth.ToString("yyyy-MM"),
                YearKey = previousMonth.Year.ToString(),
                Category = "Childcare",
                isRecurring = true,
                isShared = false,
                isChild = true,
                GroupId = "group2",
                CreatedByUserId = "user2"
            };

            // Non-recurring Shared-Ausgabe aus Mai (darf nicht kopiert werden)
            var nonRecurringExpense = new Expense
            {
                Id = "prev_shared_nonrecurring1",
                Name = "One-time Fee",
                Amount = 50,
                Date = new DateTime(previousMonth.Year, previousMonth.Month, 10),
                MonthKey = previousMonth.ToString("yyyy-MM"),
                YearKey = previousMonth.Year.ToString(),
                Category = "Fees",
                isRecurring = false,
                isShared = true,
                GroupId = "group1",
                CreatedByUserId = "user1"
            };

            // Personal-Ausgabe aus Mai (darf nicht kopiert werden)
            var personalExpense = new Expense
            {
                Id = "prev_personal_recurring1",
                Name = "Personal Subscription",
                Amount = 20,
                Date = new DateTime(previousMonth.Year, previousMonth.Month, 10),
                MonthKey = previousMonth.ToString("yyyy-MM"),
                YearKey = previousMonth.Year.ToString(),
                Category = "Subscription",
                isRecurring = true,
                isPersonal = true,
                isShared = false,
                isChild = false,
                GroupId = null,
                CreatedByUserId = "user1"
            };

            // In-Memory-Datenbank mit den relevanten Vormonats-Einträgen befüllen
            await _context.SharedExpenses.AddRangeAsync(recurringExpense1, recurringExpense2, nonRecurringExpense);
            await _context.SaveChangesAsync();

            // Act: Kopiermethode ausführen
            await _controller.CopyRecurringSharedExpenses();

            // Assert: Nur die beiden recurring-Ausgaben wurden kopiert
            var currentMonthExpenses = await _context.SharedExpenses
                .Where(e => e.Date >= currentMonthStart && e.Date < currentMonthStart.AddMonths(1))
                .ToListAsync();

            Assert.Equal(2, currentMonthExpenses.Count);

            // Prüfen, dass "Shared Rent" korrekt kopiert wurde
            var copiedExpense1 = currentMonthExpenses.FirstOrDefault(e => e.Name == "Shared Rent");
            Assert.NotNull(copiedExpense1);
            Assert.Equal(recurringExpense1.Amount, copiedExpense1.Amount);
            Assert.Equal(recurringExpense1.Category, copiedExpense1.Category);
            Assert.Equal(recurringExpense1.isShared, copiedExpense1.isShared);
            Assert.False(copiedExpense1.isChild);
            Assert.Equal(recurringExpense1.GroupId, copiedExpense1.GroupId);
            Assert.Equal(recurringExpense1.CreatedByUserId, copiedExpense1.CreatedByUserId);
            Assert.True(copiedExpense1.isRecurring);
            Assert.False(copiedExpense1.isBalanced);
            Assert.Equal(new DateTime(currentMonthStart.Year, currentMonthStart.Month, 15), copiedExpense1.Date);
            Assert.NotEqual(recurringExpense1.Id, copiedExpense1.Id);

            // Prüfen, dass "Child Support" korrekt kopiert wurde
            var copiedExpense2 = currentMonthExpenses.FirstOrDefault(e => e.Name == "Child Support");
            Assert.NotNull(copiedExpense2);
            Assert.Equal(recurringExpense2.Amount, copiedExpense2.Amount);
            Assert.Equal(recurringExpense2.Category, copiedExpense2.Category);
            Assert.False(copiedExpense2.isShared);
            Assert.True(copiedExpense2.isChild);
            Assert.Equal(recurringExpense2.GroupId, copiedExpense2.GroupId);
            Assert.Equal(recurringExpense2.CreatedByUserId, copiedExpense2.CreatedByUserId);
            Assert.True(copiedExpense2.isRecurring);
            Assert.False(copiedExpense2.isBalanced);
            Assert.Equal(new DateTime(currentMonthStart.Year, currentMonthStart.Month, 5), copiedExpense2.Date);
            Assert.NotEqual(recurringExpense2.Id, copiedExpense2.Id);
        }

        [Fact]
        public async Task CopyRecurringSharedExpenses_OnlyExactExistingOldEntry_NoNewCopies()
        {
            // Arrange: Vormonats-Datum und Monatsanfang
            var previousMonth = _runDate.AddMonths(-1);
            var currentMonthStart = new DateTime(_runDate.Year, _runDate.Month, 1);

            // Vormonats-Ausgabe A (Shared)
            var expenseA_prev = new Expense
            {
                Id = "prev_A",
                Name = "Service A",
                Amount = 100,
                Date = new DateTime(previousMonth.Year, previousMonth.Month, 10),
                MonthKey = previousMonth.ToString("yyyy-MM"),
                YearKey = previousMonth.Year.ToString(),
                Category = "Services",
                isRecurring = true,
                isShared = true,
                GroupId = "groupA",
                CreatedByUserId = "userA"
            };
            await _context.SharedExpenses.AddAsync(expenseA_prev);

            // Aktuelle-Monat-Ausgabe A (exakte Kopie, um Vorhandensein zu simulieren)
            var expenseA_current = new Expense
            {
                Id = "current_A",
                Name = expenseA_prev.Name,
                Amount = expenseA_prev.Amount,
                Date = new DateTime(currentMonthStart.Year, currentMonthStart.Month, 10),
                MonthKey = currentMonthStart.ToString("yyyy-MM"),
                YearKey = currentMonthStart.Year.ToString(),
                Category = expenseA_prev.Category,
                isRecurring = true,
                isShared = true,
                GroupId = expenseA_prev.GroupId,
                CreatedByUserId = expenseA_prev.CreatedByUserId
            };
            await _context.SharedExpenses.AddAsync(expenseA_current);
            await _context.SaveChangesAsync();

            // Act: Kopiermethode ausführen
            await _controller.CopyRecurringSharedExpenses();

            // Assert: Nur die bereits vorhandene Ausgabe bleibt, keine neuen Kopien
            var currentMonthExpenses = await _context.SharedExpenses
                .Where(e => e.Date >= currentMonthStart && e.Date < currentMonthStart.AddMonths(1))
                .ToListAsync();

            Assert.Single(currentMonthExpenses);
            Assert.Equal("current_A", currentMonthExpenses.First().Id);
        }

        [Fact]
        public async Task CopyRecurringSharedExpenses_SpecificExpenseAlreadyExists_SkipsThatExpenseOnly()
        {
            // Arrange: Vormonats-Datum und Monatsanfang
            var previousMonth = _runDate.AddMonths(-1);
            var currentMonthStart = new DateTime(_runDate.Year, _runDate.Month, 1);
            var expectedDateForExpenseAInCurrentMonth = new DateTime(currentMonthStart.Year, currentMonthStart.Month, 20);
            var expectedDateForExpenseBInCurrentMonth = new DateTime(currentMonthStart.Year, currentMonthStart.Month, 25);

            // Vormonats-Ausgabe A
            var expenseA_prev = new Expense
            {
                Id = "prev_A",
                Name = "Recurring Service Alpha",
                Amount = 150,
                Date = new DateTime(previousMonth.Year, previousMonth.Month, 20),
                MonthKey = previousMonth.ToString("yyyy-MM"),
                YearKey = previousMonth.Year.ToString(),
                Category = "AlphaService",
                isRecurring = true,
                isShared = true,
                GroupId = "groupAlpha",
                CreatedByUserId = "userAlpha"
            };

            // Vormonats-Ausgabe B (child)
            var expenseB_prev = new Expense
            {
                Id = "prev_B",
                Name = "Recurring Service Beta",
                Amount = 250,
                Date = new DateTime(previousMonth.Year, previousMonth.Month, 25),
                MonthKey = previousMonth.ToString("yyyy-MM"),
                YearKey = previousMonth.Year.ToString(),
                Category = "BetaService",
                isRecurring = true,
                isShared = false,
                isChild = true,
                GroupId = "groupBeta",
                CreatedByUserId = "userBeta"
            };

            await _context.SharedExpenses.AddRangeAsync(expenseA_prev, expenseB_prev);

            // Aktuelle-Monat-Ausgabe A existiert bereits
            var expenseA_current_existing = new Expense
            {
                Id = "current_A_existing",
                Name = expenseA_prev.Name,
                Amount = expenseA_prev.Amount,
                Date = expectedDateForExpenseAInCurrentMonth,
                MonthKey = currentMonthStart.ToString("yyyy-MM"),
                YearKey = currentMonthStart.Year.ToString(),
                Category = expenseA_prev.Category,
                isRecurring = true,
                isShared = expenseA_prev.isShared,
                isChild = expenseA_prev.isChild,
                GroupId = expenseA_prev.GroupId,
                CreatedByUserId = expenseA_prev.CreatedByUserId,
                isBalanced = false
            };
            await _context.SharedExpenses.AddAsync(expenseA_current_existing);
            await _context.SaveChangesAsync();

            var initialCurrentMonthExpenses = await _context.SharedExpenses
                .Where(e => e.Date >= currentMonthStart && e.Date < currentMonthStart.AddMonths(1))
                .ToListAsync();
            Assert.Single(initialCurrentMonthExpenses); // Nur A ist initial vorhanden

            // Act: Kopiermethode ausführen
            await _controller.CopyRecurringSharedExpenses();

            // Assert: Es sollten nun 2 Ausgaben im aktuellen Monat sein: A (bestehend) und B (neu kopiert)
            var currentMonthExpensesAfterCopy = await _context.SharedExpenses
                .Where(e => e.Date >= currentMonthStart && e.Date < currentMonthStart.AddMonths(1))
                .OrderBy(e => e.Name) // Für konsistente Reihenfolge
                .ToListAsync();

            Assert.Equal(2, currentMonthExpensesAfterCopy.Count);

            // Prüfen, dass A nicht dupliziert wurde
            var serviceAlphaExpenses = currentMonthExpensesAfterCopy.Where(e => e.Name == "Recurring Service Alpha").ToList();
            Assert.Single(serviceAlphaExpenses);
            Assert.Equal(expenseA_current_existing.Id, serviceAlphaExpenses.First().Id);
            Assert.Equal(expectedDateForExpenseAInCurrentMonth, serviceAlphaExpenses.First().Date);

            // Prüfen, dass B korrekt kopiert wurde
            var serviceBetaExpense = currentMonthExpensesAfterCopy.FirstOrDefault(e => e.Name == "Recurring Service Beta");
            Assert.NotNull(serviceBetaExpense);
            Assert.Equal(expenseB_prev.Amount, serviceBetaExpense.Amount);
            Assert.Equal(expectedDateForExpenseBInCurrentMonth, serviceBetaExpense.Date);
            Assert.True(serviceBetaExpense.isRecurring);
            Assert.False(serviceBetaExpense.isBalanced);
            Assert.NotEqual(expenseB_prev.Id, serviceBetaExpense.Id);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
