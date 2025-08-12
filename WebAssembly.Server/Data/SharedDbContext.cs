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
        public DbSet<InviteToken> InviteTokens { get; set; } = default!;
        
        public DbSet<MonthlyOverview> SharedMonthlyOverviews { get; set; }
        public DbSet<ClarificationReaction> ClarificationReactions { get; set; }
        public DbSet<MonthlyOverviewSnapshot> MonthlyOverviewSnapshots { get; set; }
        public DbSet<MonthlyConfirmation> MonthlyConfirmations { get; set; } = default!;
        public DbSet<Snapshot> Snapshots { get; set; }
        public DbSet<PersonalSnapshotData> PersonalSnapshots { get; set; }
        public DbSet<Notification> Notifications { get; set; } = default!;
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            modelBuilder.Entity<AppUser>(b =>
            {
                b.HasIndex(u => u.Email)
                 .IsUnique(false); // ← später evtl. auf true setzen, wenn E-Mail Pflicht
                b.Property(u => u.DisplayName).HasMaxLength(100);
            });
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

            modelBuilder.Entity<Notification>()
                .Property(n => n.Type)
                .HasConversion(new EnumToStringConverter<ActionType>());

            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.GroupId, n.IsRead });

            modelBuilder.Entity<InviteToken>(b =>
            {
                b.HasKey(i => i.Id);
                b.HasIndex(i => i.Code).IsUnique();
                b.Property(i => i.Code).HasMaxLength(50).IsRequired();
                b.HasOne(i => i.InviterUser)
                    .WithMany()
                    .HasForeignKey(i => i.InviterUserId)
                    .OnDelete(DeleteBehavior.Restrict);
                b.HasOne(i => i.RedeemedByUser)
                    .WithMany()
                    .HasForeignKey(i => i.RedeemedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

        public SharedDbContext(DbContextOptions<SharedDbContext> options)
            : base(options)
        {
        }
    }
}