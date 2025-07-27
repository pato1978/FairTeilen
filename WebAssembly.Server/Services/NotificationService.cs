using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

public class NotificationService
{
    private readonly SharedDbContext _db;

    public NotificationService(SharedDbContext db)
    {
        _db = db;
    }

    public async Task CreateNotificationAsync(Notification notification)
    {
        _db.Add(notification);
        await _db.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(string userId, string groupId)
    {
        return await _db.Notifications
            .Where(n => n.UserId == userId && n.GroupId == groupId && !n.IsRead)
            .CountAsync();
    }

    public async Task MarkAllAsReadAsync(string userId, string groupId)
    {
        var items = await _db.Notifications
            .Where(n => n.UserId == userId && n.GroupId == groupId && !n.IsRead)
            .ToListAsync();
        foreach (var n in items)
        {
            n.IsRead = true;
        }
        await _db.SaveChangesAsync();
    }
}
