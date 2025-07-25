using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

/// <summary>
/// Service zum Laden und Speichern von Monats-Snapshots.
/// Getrennte Behandlung für:
/// - Aggregierte Daten (SnapshotData)
/// - Einzelausgaben (FullSnapshotData)
/// - Persönliche Ausgaben (PersonalSnapshotData)
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

    // ============================================================================
    // 🔹 1. AGGREGIERTER SNAPSHOT (Totals – SnapshotData)
    // ============================================================================

    /// <summary>
    /// Lädt einen Snapshot mit aggregierten Daten (Totals) für eine Gruppe.
    /// Gibt null zurück, wenn kein Snapshot vorhanden ist.
    /// </summary>
    public async Task<SnapshotData?> LoadSnapshotAsync(string groupId, string monthKey)
    {
        var snapshot = await _db.MonthlyOverviewSnapshots
            .FirstOrDefaultAsync(s => s.GroupId == groupId && s.Month == monthKey);

        if (snapshot == null)
            return null;

        return JsonSerializer.Deserialize<SnapshotData>(snapshot.SnapshotJson);
    }

    /// <summary>
    /// Speichert einen neuen Snapshot mit aggregierten Daten.
    /// Verhindert Doppeleinträge.
    /// </summary>
    public async Task SaveSnapshotAsync(string groupId, string monthKey, SnapshotData snapshotData)
    {
        var alreadyExists = await _db.MonthlyOverviewSnapshots
            .AnyAsync(s => s.GroupId == groupId && s.Month == monthKey);

        if (alreadyExists)
            throw new InvalidOperationException("Für diesen Monat existiert bereits ein Snapshot.");

        var json = JsonSerializer.Serialize(snapshotData);

        var snapshot = new MonthlyOverviewSnapshot
        {
            GroupId = groupId,
            Month = monthKey,
            Status = "completed",
            SnapshotJson = json,
            CreatedAt = DateTime.UtcNow
        };

        _db.MonthlyOverviewSnapshots.Add(snapshot);
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Löscht einen Snapshot für eine Gruppe und einen Monat.
    /// Gibt false zurück, wenn keiner existiert.
    /// </summary>
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

    // ============================================================================
    // 🔹 2. VOLLER SNAPSHOT (Einzelausgaben – FullSnapshotData)
    // ============================================================================

    /// <summary>
    /// Speichert einen FullSnapshot (shared + child Einzelausgaben).
    /// Wird getrennt gespeichert, damit er optional ist.
    /// </summary>
    public async Task SaveFullSnapshotAsync(string groupId, string monthKey, FullSnapshotData fullData)
    {
        var existing = await _db.Snapshots
            .FirstOrDefaultAsync(s => s.GroupId == groupId && s.MonthKey == monthKey);

        if (existing != null)
        {
            existing.SnapshotJsonFull = fullData;
        }
        else
        {
            _db.Snapshots.Add(new Snapshot
            {
                GroupId = groupId,
                MonthKey = monthKey,
                SnapshotJsonFull = fullData
            });
        }

        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Lädt einen vollständigen Snapshot mit Einzelausgaben (shared + child).
    /// </summary>
    public async Task<FullSnapshotData?> LoadFullSnapshotAsync(string groupId, string monthKey)
    {
        var snapshot = await _db.Snapshots
            .FirstOrDefaultAsync(s => s.GroupId == groupId && s.MonthKey == monthKey);

        return snapshot?.SnapshotJsonFull;
    }

    // ============================================================================
    // 🔹 3. PERSÖNLICHER SNAPSHOT (nur Personal-Ausgaben)
    // ============================================================================

    /// <summary>
    /// Speichert persönliche Ausgaben eines Users für einen Monat und eine Gruppe.
    /// Überschreibt ggf. bestehenden Eintrag.
    /// </summary>
    public async Task SavePersonalSnapshotAsync(PersonalSnapshotData personal)
    {
        var existing = await _db.PersonalSnapshots
            .FirstOrDefaultAsync(p =>
                p.UserId == personal.UserId &&
                p.GroupId == personal.GroupId &&
                p.MonthKey == personal.MonthKey);

        if (existing != null)
            _db.PersonalSnapshots.Remove(existing);

        _db.PersonalSnapshots.Add(personal);
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Lädt persönliche Ausgaben eines Users für einen Monat und eine Gruppe.
    /// </summary>
    public async Task<PersonalSnapshotData?> GetPersonalSnapshotAsync(string userId, string groupId, string monthKey)
    {
        return await _db.PersonalSnapshots
            .FirstOrDefaultAsync(p =>
                p.UserId == userId &&
                p.GroupId == groupId &&
                p.MonthKey == monthKey);
    }
}
