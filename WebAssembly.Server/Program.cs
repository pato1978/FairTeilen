using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using WebAssembly.Server.Data;
using WebAssembly.Server.Services;
using Hangfire;              // für Hangfire-Klassen (z.B. RecurringJob)
using Hangfire.SqlServer;
using WebAssembly.Server.Controllers; // für die SQL Server–Storage-Implementierung von Hangfire

var builder = WebApplication.CreateBuilder(args);

// 🔑 Verbindung zur Shared-Datenbank (MSSQL)
var sharedConnection = builder.Configuration.GetConnectionString("SharedDb")
                    ?? throw new InvalidOperationException("❌ Verbindung 'SharedDb' ist nicht gesetzt.");

// ────────────────────────────────────────────────────────────────────────────────
// 📦 Hangfire-Services registrieren
//     1) UseSqlServerStorage: Hangfire legt seine Tabellen in derselben MSSQL-Datenbank an.
//     2) AddHangfireServer: startet den Background-Worker-Prozess.
// ────────────────────────────────────────────────────────────────────────────────
builder.Services.AddHangfire(config => config
    .UseSqlServerStorage(sharedConnection, new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.FromSeconds(15),
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true
    })
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
);
builder.Services.AddHangfireServer();

// ────────────────────────────────────────────────────────────────────────────────
// 📦 Weitere Services registrieren
// ────────────────────────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// 📦 Lokale SQLite-Datenbank (private Ausgaben)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=expenses.db"));

// 📦 Zentrale MSSQL-Datenbank (gemeinsame & Kind-Ausgaben)
builder.Services.AddDbContext<SharedDbContext>(options =>
    options.UseSqlServer(sharedConnection));

// Beispiel: dein YearOverviewService bleibt, wenn du ihn sonst irgendwo nutzt
builder.Services.AddScoped<YearOverviewService>();

// ✅ CORS konfigurieren
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// ✅ Middleware-Reihenfolge
app.UseHttpsRedirection();
app.UseRouting();

// ────────────────────────────────────────────────────────────────────────────────
// Hangsfire-Dashboard wurde hier weggelassen.
// Wenn du später das Dashboard hinzufügen möchtest, 
// musst du nur "app.UseHangfireDashboard(...)" wieder einfügen.
// ────────────────────────────────────────────────────────────────────────────────

app.UseCors();
app.UseAuthorization();

app.MapControllers();

// ────────────────────────────────────────────────────────────────────────────────
// Recurring Job definieren:
//    Jeden Monat am 1. um 00:05 Uhr (Mitteleuropäische Zeit) soll 
//    ExpensesController.CopyRecurringSharedExpenses() ausgeführt werden.
//    Cron: "5 0 1 * *" = Minute 5, Stunde 0, Tag 1 jeden Monats.
// ────────────────────────────────────────────────────────────────────────────────
RecurringJob.AddOrUpdate<ExpensesController>(
    "monthly-copy-shared-expenses",                                        // Eindeutiger Job-Name
    controller => controller.CopyRecurringSharedExpenses(),               // Methode im Controller
    "5 0 1 * *",                                                           // Cron-Ausdruck
    TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time")  // MEZ/CEST
);

app.Run();
