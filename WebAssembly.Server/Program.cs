using System.Text.Json;
using System.Text.Json.Serialization;
using Hangfire;
using Hangfire.Common;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WebAssembly.Server.Data;
using WebAssembly.Server.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ✅ Sichere Connection
var sharedConnection = builder.Configuration.GetConnectionString("SharedDb")
    ?? throw new InvalidOperationException("❌ Verbindung 'SharedDb' ist nicht gesetzt.");

// 🔧 Datenbank-Kontext
builder.Services.AddDbContext<SharedDbContext>(options =>
    options.UseSqlServer(sharedConnection));

// 🔧 Hangfire Setup
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
    .UseRecommendedSerializerSettings());

builder.Services.AddHangfireServer();

// 🔧 MVC / JSON Enum-Handling
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: false)
        );
    });

// 🔧 Eigene Services
builder.Services.AddScoped<YearOverviewService>();
builder.Services.AddScoped<SnapshotService>();

builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<NotificationDispatcher>();
builder.Services.AddTransient<IMailService, MailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IInviteService, InviteService>();

var secret = builder.Configuration["JWT:Secret"] ?? "REPLACE_WITH_STRONG_RANDOM_SECRET";
var issuer = builder.Configuration["JWT:Issuer"] ?? "api.local";
var audience = builder.Configuration["JWT:Audience"] ?? "api.local";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("authLimiter", o =>
    {
        o.Window = TimeSpan.FromSeconds(30);
        o.PermitLimit = 10;
        o.QueueLimit = 0;
    });
});

// 🔧 CORS – bei Bedarf um weitere Umgebungen erweitern
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://localhost",
                "http://localhost:5289",  // ⚠️ Diese Zeile
                "null"  
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// ✅ HINZUFÜGEN: Hangfire Dashboard aktivieren
app.UseHangfireDashboard("/hangfire");

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine("❌ UNHANDLED EXCEPTION:");
        Console.WriteLine(ex.Message);
        Console.WriteLine(ex.StackTrace);
        throw;
    }
});
app.MapControllers();

// 📅 Cron-Job für wiederkehrende Ausgaben
using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

    // ✅ VERBESSERUNG: Logging hinzufügen
    Console.WriteLine("🔄 Registriere Hangfire Recurring Job...");
    
    recurringJobManager.AddOrUpdate(
        "monthly-copy-shared-expenses",
        Job.FromExpression<WebAssembly.Server.Controllers.ExpensesController>(c => c.CopyRecurringSharedExpenses()),
        "5 0 1 * *",
        TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time")
    );
    
    Console.WriteLine("✅ Hangfire Job 'monthly-copy-shared-expenses' erfolgreich registriert");
    Console.WriteLine($"⏰ Nächste Ausführung: Jeden 1. des Monats um 00:05 (CEST)");
    Console.WriteLine($"🌍 Zeitzone: Central European Standard Time");
}

app.Run();
