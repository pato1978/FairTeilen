namespace WebAssembly.Server.Models;

public class FullSnapshotData: SnapshotData
{
    public List<Expense> SharedAndChildExpenses { get; set; } = new();
}