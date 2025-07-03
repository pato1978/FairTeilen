using System;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Text.Json.Serialization;           // Für JsonStringEnumConverter
using Hangfire;
using Hangfire.Common;
using Hangfire.SqlServer;
using WebAssembly.Server.Data;
using WebAssembly.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// 🔑 1. Verbindung zur Shared-Datenbank (MSSQL) aus Konfiguration holen
var sharedConnection = builder.Configuration.GetConnectionString("SharedDb")
    ?? throw new InvalidOperationException("❌ Verbindung 'SharedDb' ist nicht gesetzt.");

// ────────────────────────────────────────────────────────────────────────────────
// 📦 2. Hangfire-Services registrieren
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
// 📦 3. MVC / API-Controller registrieren mit globaler Enum-String-Konvertierung
// ────────────────────────────────────────────────────────────────────────────────
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        // Wir nutzen CamelCase-NamingPolicy, damit JSON-Werte wie "shared" in ExpenseType.Shared konvertiert werden
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: false)
        );
    });

// ────────────────────────────────────────────────────────────────────────────────
// 📦 4. DbContext für SharedDbContext (MSSQL) hinzufügen
// ────────────────────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<SharedDbContext>(options =>
    options.UseSqlServer(sharedConnection));

// ────────────────────────────────────────────────────────────────────────────────
// 📦 5. Weitere Anwendungsspezifische Services
// ────────────────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<YearOverviewService>();

// ────────────────────────────────────────────────────────────────────────────────
// 📦 6. CORS-Policy konfigurieren
// ────────────────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────────────────
// 🔧 7. Middleware-Pipeline
// ────────────────────────────────────────────────────────────────────────────────
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors();
app.UseAuthorization();

// 📌 Controller-Routen mappen
app.MapControllers();

// ────────────────────────────────────────────────────────────────────────────────
// 📅 8. Hangfire Cron-Job für wiederkehrende Ausgaben in Hangfire anlegen
// ────────────────────────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

    // Führt CopyRecurringSharedExpenses jeden Monat am 1. um 00:05 MEZ aus
    recurringJobManager.AddOrUpdate(
        "monthly-copy-shared-expenses",
        Job.FromExpression<WebAssembly.Server.Controllers.ExpensesController>(c => c.CopyRecurringSharedExpenses()),
        "5 0 1 * *",
        TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time")
    );
}

// 🚀 9. Anwendung starten
app.Run();
