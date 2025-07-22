using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Data
{
    public class SharedDbContext : DbContext
    {
        public DbSet<Expense> SharedExpenses { get; set; }
        public DbSet<BudgetEntry> SharedBudgets { get; set; }
        public DbSet<User> SharedUsers { get; set; }
        
        public DbSet<MonthlyOverview> SharedMonthlyOverviews { get; set; }
        public DbSet<ClarificationReaction> ClarificationReactions { get; set; }
        public DbSet<MonthlyOverviewSnapshot> MonthlyOverviewSnapshots { get; set; }
        public DbSet<MonthlyConfirmation> MonthlyConfirmations { get; set; } = default!;
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // ✅ Markiere MonthlyOverview als keyless ViewModel
            modelBuilder.Entity<MonthlyOverview>().HasNoKey();
            // 🔗 Beziehung zur Ausgabe – optional (nur nötig, wenn Navigation verwendet wird)
            // Wenn du KEIN `Include(r => r.Expense)` benutzt, kannst du das hier sogar ganz weglassen.
            modelBuilder.Entity<ClarificationReaction>()
                .HasOne<Expense>() // kein Navigation-Property notwendig
                .WithMany()
                .HasForeignKey(r => r.ExpenseId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ Status ist Pflicht
            modelBuilder.Entity<ClarificationReaction>()
                .Property(c => c.Status)
                .IsRequired();
            //Damit jede Kombination aus UserId, GroupId und MonthKey nur einmal vorkommen kann:
            modelBuilder.Entity<MonthlyConfirmation>()
                .HasIndex(c => new { c.UserId, c.GroupId, c.MonthKey })
                .IsUnique();
        }

        public SharedDbContext(DbContextOptions<SharedDbContext> options)
            : base(options)
        {
        }
    }
}