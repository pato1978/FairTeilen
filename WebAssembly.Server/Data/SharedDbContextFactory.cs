using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using WebAssembly.Server.Data;

namespace WebAssembly.Server;

public class SharedDbContextFactory : IDesignTimeDbContextFactory<SharedDbContext>
{
    public SharedDbContext CreateDbContext(string[] args)
    {
        // 1. Basis-Pfad ermitteln
        var basePath = Directory.GetCurrentDirectory();

        // 2. Environment ermitteln (Default "Development")
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                          ?? "Development";

        // 3. ConfigurationBuilder aufsetzen
        var config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddUserSecrets<SharedDbContextFactory>(optional: true)   // liest deine User-Secrets
            .AddEnvironmentVariables()                                // überschreibt mit Env‑Vars bei Bedarf
            .Build();

        // 4. ConnectionString auslesen
        var connectionString = config.GetConnectionString("SharedDb")
                               ?? throw new InvalidOperationException("ConnectionString 'SharedDb' nicht gefunden.");

        // 5. DbContextOptions bauen und zurückgeben
        var optionsBuilder = new DbContextOptionsBuilder<SharedDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new SharedDbContext(optionsBuilder.Options);
    }
}