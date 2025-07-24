using System.ComponentModel.DataAnnotations;

namespace WebAssembly.Server.Models;

public class Snapshot
{   
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string GroupId { get; set; } = "";
    public string MonthKey { get; set; } = "";

    public SnapshotData? SnapshotJsonTotals { get; set; }
    public FullSnapshotData? SnapshotJsonFull { get; set; }
}