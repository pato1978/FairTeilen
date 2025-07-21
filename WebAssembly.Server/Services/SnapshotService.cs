using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services
{
    /// <summary>
    /// Service zum Laden und Speichern von Monats-Snapshots.
    /// </summary>
    public class SnapshotService
    {
        private readonly SharedDbContext _db;

        /// <summary>
        /// Konstruktor: Injiziert nur den DbContext, um zirkuläre Abhängigkeiten zu vermeiden.
        /// </summary>
        public SnapshotService(SharedDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Lädt einen gespeicherten Snapshot für eine Gruppe und einen Monat.
        /// Gibt null zurück, wenn kein Snapshot vorhanden ist.
        /// </summary>
        /// <param name="groupId">ID der Gruppe</param>
        /// <param name="monthKey">Monatskennzeichen im Format "YYYY-MM"</param>
        /// <returns>Deserialisierte SnapshotData oder null</returns>
        public async Task<SnapshotData?> LoadSnapshotAsync(string groupId, string monthKey)
        {
            var snapshot = await _db.MonthlyOverviewSnapshots
                .FirstOrDefaultAsync(s => s.GroupId == groupId && s.Month == monthKey);

            if (snapshot == null)
                return null;

            // JSON zurück in SnapshotData umwandeln
            return JsonSerializer.Deserialize<SnapshotData>(snapshot.SnapshotJson);
        }

        /// <summary>
        /// Speichert einen Snapshot. Die Übersicht (YearOverview) wird außerhalb berechnet
        /// und als SnapshotData übergeben, um zirkuläre Abhängigkeiten zu vermeiden.
        /// </summary>
        /// <param name="groupId">ID der Gruppe</param>
        /// <param name="monthKey">Monatskennzeichen im Format "YYYY-MM"</param>
        /// <param name="snapshotData">Berechnete Snapshot-Daten</param>
        public async Task SaveSnapshotAsync(string groupId, string monthKey, SnapshotData snapshotData)
        {
            // Prüfen, ob für diesen Monat bereits ein Snapshot existiert
            var alreadyExists = await _db.MonthlyOverviewSnapshots
                .AnyAsync(s => s.GroupId == groupId && s.Month == monthKey);

            if (alreadyExists)
                throw new InvalidOperationException("Für diesen Monat existiert bereits ein Snapshot.");

            // Snapshot als JSON serialisieren
            var json = JsonSerializer.Serialize(snapshotData);

            // Neues Snapshot-Objekt anlegen
            var snapshot = new MonthlyOverviewSnapshot
            {
                GroupId = groupId,
                Month = monthKey,
                Status = "completed",
                SnapshotJson = json,
                CreatedAt = DateTime.UtcNow
            };

            // Speichern
            _db.MonthlyOverviewSnapshots.Add(snapshot);
            await _db.SaveChangesAsync();
        }
        public async Task<bool> DeleteSnapshotAsync(string groupId, string monthKey)
        {
            var snapshot = await _db.MonthlyOverviewSnapshots
                .FirstOrDefaultAsync(s => s.GroupId == groupId && s.Month == monthKey);

            if (snapshot == null)
                return false;

            _db.MonthlyOverviewSnapshots.Remove(snapshot);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
