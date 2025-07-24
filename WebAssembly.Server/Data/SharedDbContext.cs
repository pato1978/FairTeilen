using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Models;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
namespace WebAssembly.Server.Data
{
    public class SharedDbContext : DbContext
    {
        public DbSet<Expense> SharedExpenses { get; set; }
        public DbSet<BudgetEntry> SharedBudgets { get; set; }
        public DbSet<AppUser> Users { get; set; }
        
        public DbSet<MonthlyOverview> SharedMonthlyOverviews { get; set; }
        public DbSet<ClarificationReaction> ClarificationReactions { get; set; }
        public DbSet<MonthlyOverviewSnapshot> MonthlyOverviewSnapshots { get; set; }
        public DbSet<MonthlyConfirmation> MonthlyConfirmations { get; set; } = default!;
        public DbSet<Snapshot> Snapshots { get; set; }
        public DbSet<PersonalSnapshotData> PersonalSnapshots { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            modelBuilder.Entity<AppUser>()
                .HasIndex(u => u.Email)
                .IsUnique(false); // ← später evtl. auf true setzen, wenn E-Mail Pflicht
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
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // SnapshotData als JSON speichern
            modelBuilder.Entity<Snapshot>()
                .Property(s => s.SnapshotJsonTotals)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, options),
                    v => JsonSerializer.Deserialize<SnapshotData>(v, options)
                );

            // FullSnapshotData als JSON speichern
            modelBuilder.Entity<Snapshot>()
                .Property(s => s.SnapshotJsonFull)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, options),
                    v => JsonSerializer.Deserialize<FullSnapshotData>(v, options)
                );

            // PersonalExpenses als JSON speichern (Liste in PersonalSnapshotData)
            modelBuilder.Entity<PersonalSnapshotData>()
                .Property(p => p.PersonalExpenses)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, options),
                    v => JsonSerializer.Deserialize<List<Expense>>(v, options)
                );
        }

        public SharedDbContext(DbContextOptions<SharedDbContext> options)
            : base(options)
        {
        }
    }
}