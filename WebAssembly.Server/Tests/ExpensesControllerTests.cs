using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Controllers;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;
using Xunit;

// Note on DateTime.Today:
// The `CopyRecurringSharedExpenses` method in `ExpensesController` uses `DateTime.Today` directly.
// For more deterministic testing across different dates, especially for end-of-month scenarios
// (e.g., copying from Jan 31st to Feb), abstracting `DateTime.Today` (e.g., via an IClock interface
// or passing the date as a parameter to the method) would be beneficial.
// These tests use `_runDate = DateTime.Today` at the time of test execution, making "previous"
// and "current" months relative to that execution time. This is generally fine for verifying
// the core logic but makes targeted date testing (e.g. "run this test as if today is Feb 28th") harder.
namespace WebAssembly.Server.Tests
{
    public class ExpensesControllerTests : IDisposable
    {
        private readonly SharedDbContext _context;
        private readonly ExpensesController _controller;
        private readonly DateTime _runDate; // To ensure consistent "today" for tests

        public ExpensesControllerTests()
        {
            _runDate = DateTime.Today; // Could be fixed for more deterministic tests across days

            var options = new DbContextOptionsBuilder<SharedDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Unique DB for each test run
                .Options;
            _context = new SharedDbContext(options);

            // We need an AppDbContext mock/stub as well, though it's not directly used by CopyRecurringSharedExpenses
            // For simplicity, we can use an in-memory AppDbContext too if no complex interaction is needed.
            // If AppDbContext is not used by the method under test, it could even be null,
            // but it's safer to provide a valid, albeit unused, instance.
            var appDbOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var appDbContext = new AppDbContext(appDbOptions);

            _controller = new ExpensesController(appDbContext, _context);
        }

        [Fact]
        public async Task CopyRecurringSharedExpenses_NoExpensesCopiedYet_CopiesPreviousMonthExpenses()
        {
            // Arrange
            var previousMonth = _runDate.AddMonths(-1);
            var currentMonthStart = new DateTime(_runDate.Year, _runDate.Month, 1);

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
                isShared = false, // Important: isChild implies it's handled by SharedDbContext
                isChild = true,
                GroupId = "group2", // Can be different or same, based on logic
                CreatedByUserId = "user2"
            };

            // Non-recurring expense, should not be copied
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

            // Personal expense, should not be copied by this method
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
                isPersonal = true, // This would be in AppDbContext, but good to define for clarity
                isShared = false,
                isChild = false,
                GroupId = null,
                CreatedByUserId = "user1"
            };


            await _context.SharedExpenses.AddRangeAsync(recurringExpense1, recurringExpense2, nonRecurringExpense);
            await _context.SaveChangesAsync();

            // Act
            await _controller.CopyRecurringSharedExpenses();

            // Assert
            var currentMonthExpenses = await _context.SharedExpenses
                .Where(e => e.Date >= currentMonthStart && e.Date < currentMonthStart.AddMonths(1))
                .ToListAsync();

            Assert.Equal(2, currentMonthExpenses.Count); // Only the two recurring shared/child expenses

            var copiedExpense1 = currentMonthExpenses.FirstOrDefault(e => e.Name == "Shared Rent");
            Assert.NotNull(copiedExpense1);
            Assert.Equal(recurringExpense1.Amount, copiedExpense1.Amount);
            Assert.Equal(recurringExpense1.Category, copiedExpense1.Category);
            Assert.Equal(recurringExpense1.isShared, copiedExpense1.isShared);
            Assert.Equal(recurringExpense1.isChild, copiedExpense1.isChild); // Should be false
            Assert.Equal(recurringExpense1.GroupId, copiedExpense1.GroupId);
            Assert.Equal(recurringExpense1.CreatedByUserId, copiedExpense1.CreatedByUserId);
            Assert.True(copiedExpense1.isRecurring);
            Assert.False(copiedExpense1.isBalanced);
            Assert.Equal(new DateTime(currentMonthStart.Year, currentMonthStart.Month, 15), copiedExpense1.Date);
            Assert.NotEqual(recurringExpense1.Id, copiedExpense1.Id); // New ID

            var copiedExpense2 = currentMonthExpenses.FirstOrDefault(e => e.Name == "Child Support");
            Assert.NotNull(copiedExpense2);
            Assert.Equal(recurringExpense2.Amount, copiedExpense2.Amount);
            Assert.Equal(recurringExpense2.Category, copiedExpense2.Category);
            Assert.False(copiedExpense2.isShared); // Should be false as per original
            Assert.True(copiedExpense2.isChild);  // Should be true as per original
            Assert.Equal(recurringExpense2.GroupId, copiedExpense2.GroupId);
            Assert.Equal(recurringExpense2.CreatedByUserId, copiedExpense2.CreatedByUserId);
            Assert.True(copiedExpense2.isRecurring);
            Assert.False(copiedExpense2.isBalanced);
            Assert.Equal(new DateTime(currentMonthStart.Year, currentMonthStart.Month, 5), copiedExpense2.Date);
            Assert.NotEqual(recurringExpense2.Id, copiedExpense2.Id); // New ID
        }

        [Fact]
        public async Task CopyRecurringSharedExpenses_ExpensesAlreadyCopied_DoesNotCopyAgain()
        {
            // Arrange
            var previousMonth = _runDate.AddMonths(-1);
            var currentMonthStart = new DateTime(_runDate.Year, _runDate.Month, 1);

            // Expense from previous month that would normally be copied
            var recurringExpenseFromPrevMonth = new Expense
            {
                Id = "prev_re_shared1",
                Name = "Shared Service Fee",
                Amount = 75,
                Date = new DateTime(previousMonth.Year, previousMonth.Month, 10),
                MonthKey = previousMonth.ToString("yyyy-MM"),
                YearKey = previousMonth.Year.ToString(),
                Category = "Services",
                isRecurring = true,
                isShared = true,
                GroupId = "group3",
                CreatedByUserId = "user3"
            };
            await _context.SharedExpenses.AddAsync(recurringExpenseFromPrevMonth);

            // Simulate an already copied expense in the current month
            var alreadyCopiedExpense = new Expense
            {
                Id = "current_re_shared_copied1",
                Name = "Some Copied Service", // Name can be different, the check is on date and flags
                Amount = 100,
                Date = new DateTime(currentMonthStart.Year, currentMonthStart.Month, 5), // A day in current month
                MonthKey = currentMonthStart.ToString("yyyy-MM"),
                YearKey = currentMonthStart.Year.ToString(),
                Category = "Services",
                isRecurring = true, // Critically, this must be true for the initial check
                isShared = true,    // and this or isChild
                isChild = false,
                GroupId = "groupX",
                CreatedByUserId = "userX"
            };
            await _context.SharedExpenses.AddAsync(alreadyCopiedExpense);
            await _context.SaveChangesAsync();

            var initialCurrentMonthCount = await _context.SharedExpenses
                .CountAsync(e => e.Date >= currentMonthStart && e.Date < currentMonthStart.AddMonths(1) && (e.isShared || e.isChild) && e.isRecurring);

            Assert.Equal(1, initialCurrentMonthCount); // Ensure our setup is correct

            // Act
            await _controller.CopyRecurringSharedExpenses();

            // Assert
            var currentMonthExpenses = await _context.SharedExpenses
                .Where(e => e.Date >= currentMonthStart && e.Date < currentMonthStart.AddMonths(1))
                .ToListAsync();

            // The count should still be 1, meaning no new expense (like recurringExpenseFromPrevMonth) was copied
            Assert.Equal(1, currentMonthExpenses.Count);
            Assert.Contains(currentMonthExpenses, e => e.Id == alreadyCopiedExpense.Id);
        }

        [Fact]
        public async Task CopyRecurringSharedExpenses_SpecificExpenseAlreadyExists_SkipsThatExpenseOnly()
        {
            // Arrange
            var previousMonth = _runDate.AddMonths(-1);
            var currentMonthStart = new DateTime(_runDate.Year, _runDate.Month, 1);
            var expectedDateForExpenseAInCurrentMonth = new DateTime(currentMonthStart.Year, currentMonthStart.Month, 20);
            var expectedDateForExpenseBInCurrentMonth = new DateTime(currentMonthStart.Year, currentMonthStart.Month, 25);

            // Expense A from previous month
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

            // Expense B from previous month (will be copied)
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
                isChild = true, // Mix it up: child expense
                GroupId = "groupBeta",
                CreatedByUserId = "userBeta"
            };

            await _context.SharedExpenses.AddRangeAsync(expenseA_prev, expenseB_prev);

            // Manually add a version of Expense A to the current month to simulate it already existing
            // This version must match what the copy logic would try to create (name, amount, date, group, recurring status)
            var expenseA_current_existing = new Expense
            {
                Id = "current_A_existing", // Different ID, but content matches for duplication check
                Name = expenseA_prev.Name,
                Amount = expenseA_prev.Amount,
                Date = expectedDateForExpenseAInCurrentMonth, // Date it would have if copied
                MonthKey = currentMonthStart.ToString("yyyy-MM"),
                YearKey = currentMonthStart.Year.ToString(),
                Category = expenseA_prev.Category,
                isRecurring = true, // Critical for the inner loop's duplicate check
                isShared = expenseA_prev.isShared,
                isChild = expenseA_prev.isChild,
                GroupId = expenseA_prev.GroupId,
                CreatedByUserId = expenseA_prev.CreatedByUserId,
                isBalanced = false // Or true, doesn't matter for the check itself
            };
            await _context.SharedExpenses.AddAsync(expenseA_current_existing);
            await _context.SaveChangesAsync();

            var initialCurrentMonthExpenses = await _context.SharedExpenses
                .Where(e => e.Date >= currentMonthStart && e.Date < currentMonthStart.AddMonths(1))
                .ToListAsync();
            Assert.Single(initialCurrentMonthExpenses); // Only expenseA_current_existing

            // Act
            await _controller.CopyRecurringSharedExpenses();

            // Assert
            var currentMonthExpensesAfterCopy = await _context.SharedExpenses
                .Where(e => e.Date >= currentMonthStart && e.Date < currentMonthStart.AddMonths(1))
                .OrderBy(e => e.Name) // For consistent order
                .ToListAsync();

            // Should now have 2 expenses: the pre-existing A, and the newly copied B
            Assert.Equal(2, currentMonthExpensesAfterCopy.Count);

            // Check that expenseA_current_existing is still there and no duplicate of it was made
            var serviceAlphaExpenses = currentMonthExpensesAfterCopy.Where(e => e.Name == "Recurring Service Alpha").ToList();
            Assert.Single(serviceAlphaExpenses); // Only one
            Assert.Equal(expenseA_current_existing.Id, serviceAlphaExpenses.First().Id);
            Assert.Equal(expectedDateForExpenseAInCurrentMonth, serviceAlphaExpenses.First().Date);

            // Check that expense B was copied
            var serviceBetaExpense = currentMonthExpensesAfterCopy.FirstOrDefault(e => e.Name == "Recurring Service Beta");
            Assert.NotNull(serviceBetaExpense);
            Assert.Equal(expenseB_prev.Amount, serviceBetaExpense.Amount);
            Assert.Equal(expectedDateForExpenseBInCurrentMonth, serviceBetaExpense.Date);
            Assert.True(serviceBetaExpense.isRecurring);
            Assert.False(serviceBetaExpense.isBalanced);
            Assert.NotEqual(expenseB_prev.Id, serviceBetaExpense.Id); // New ID for copied expense
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted(); // Clean up the in-memory database
            _context.Dispose();
        }
    }
}
