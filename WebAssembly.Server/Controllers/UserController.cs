using Microsoft.AspNetCore.Mvc;
using WebAssembly.Server.Data;
using WebAssembly.Server.Services;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly SharedDbContext _db;
    private readonly UserService _userService;

    public UserController(UserService userService, SharedDbContext db)
    {
        _userService = userService;
        _db = db;
    }

    [HttpGet("userinfo")]
    public async Task<ActionResult<AppUser>> GetUserInfo([FromQuery] string userId)
    {
        var user = await _userService.EnsureUserExistsAsync(userId);
        return Ok(user);
    }

    [HttpPost("update")]
    public async Task<IActionResult> UpdateUser([FromBody] AppUser updatedUser)
    {
        var user = await _userService.EnsureUserExistsAsync(updatedUser.Id);

        user.DisplayName = updatedUser.DisplayName;
        user.AvatarUrl = updatedUser.AvatarUrl;
        user.ProfileColor = updatedUser.ProfileColor;

        await _db.SaveChangesAsync(); // 🔧 Direkter DB-Zugriff

        return Ok(user);
    }
}