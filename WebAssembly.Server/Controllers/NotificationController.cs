using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;
using WebAssembly.Server.Services;

namespace WebAssembly.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly SharedDbContext _db;
    private readonly NotificationService _service;

    public NotificationController(SharedDbContext db, NotificationService service)
    {
        _db = db;
        _service = service;
    }

    // GET /api/notification?groupId=...&userId=...&page=1
    [HttpGet]
    public async Task<ActionResult<List<Notification>>> GetNotifications(
        [FromQuery] string groupId,
        [FromQuery] string userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (string.IsNullOrWhiteSpace(groupId) || string.IsNullOrWhiteSpace(userId))
            return BadRequest("groupId und userId sind erforderlich");

        var query = _db.Notifications
            .Where(n => n.GroupId == groupId && n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount(
        [FromQuery] string groupId,
        [FromQuery] string userId)
    {
        if (string.IsNullOrWhiteSpace(groupId) || string.IsNullOrWhiteSpace(userId))
            return BadRequest("groupId und userId sind erforderlich");

        var count = await _service.GetUnreadCountAsync(userId, groupId);
        return Ok(count);
    }

    // PUT /api/notification/{id}/read
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(string id)
    {
        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id);
        if (notification == null) return NotFound();
        notification.IsRead = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/notification/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(string id)
    {
        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id);
        if (notification == null) return NotFound();
        _db.Notifications.Remove(notification);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
