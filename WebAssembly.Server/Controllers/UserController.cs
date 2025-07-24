// WebAssembly.Server/Controllers/UserController.cs - VOLLSTÄNDIG
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    /// <summary>
    /// ✅ Einzelnen User laden/erstellen (BESTEHEND)
    /// GET /api/user/userinfo?userId=...
    /// </summary>
    [HttpGet("userinfo")]
    public async Task<ActionResult<AppUser>> GetUserInfo([FromQuery] string userId)
    {
        try
        {
            var user = await _userService.EnsureUserExistsAsync(userId);
            return Ok(user);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Fehler beim Laden von User {userId}: {ex.Message}");
            return StatusCode(500, "Fehler beim Laden der User-Daten");
        }
    }

    /// <summary>
    /// 🆕 ALLE User laden (FÜR PROFIL-AUSWAHL)
    /// GET /api/user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<AppUser>>> GetAllUsers()
    {
        try
        {
            var users = await _db.Users
                .Where(u => !u.IsDeleted) // Nur aktive User
                .OrderBy(u => u.DisplayName)
                .ToListAsync();
                
            Console.WriteLine($"✅ {users.Count} User für Profil-Auswahl geladen");
            return Ok(users);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Fehler beim Laden aller User: {ex.Message}");
            return StatusCode(500, "Fehler beim Laden der User-Liste");
        }
    }

    /// <summary>
    /// ✅ User aktualisieren (ERWEITERT)
    /// POST /api/user/update
    /// </summary>
    [HttpPost("update")]
    public async Task<IActionResult> UpdateUser([FromBody] AppUser updatedUser)
    {
        try
        {
            if (string.IsNullOrEmpty(updatedUser.Id))
            {
                return BadRequest("User-ID ist erforderlich");
            }

            var user = await _userService.EnsureUserExistsAsync(updatedUser.Id);

            // Alle editierbaren Felder aktualisieren
            user.DisplayName = updatedUser.DisplayName;
            user.Email = updatedUser.Email;
            user.ProfileColor = updatedUser.ProfileColor;
            user.AvatarUrl = updatedUser.AvatarUrl;

            await _db.SaveChangesAsync();

            Console.WriteLine($"✅ User {user.Id} erfolgreich aktualisiert: {user.DisplayName}");
            return Ok(user);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Fehler beim Aktualisieren von User: {ex.Message}");
            return StatusCode(500, "Fehler beim Aktualisieren der User-Daten");
        }
    }

    /// <summary>
    /// 🆕 User nach E-Mail suchen
    /// GET /api/user/by-email?email=...
    /// </summary>
    [HttpGet("by-email")]
    public async Task<ActionResult<AppUser>> GetUserByEmail([FromQuery] string email)
    {
        try
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest("E-Mail-Adresse ist erforderlich");
            }

            var user = await _userService.GetUserByEmailAsync(email);
            
            if (user == null)
            {
                return NotFound($"Kein User mit E-Mail '{email}' gefunden");
            }
                
            return Ok(user);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Fehler beim Suchen nach E-Mail {email}: {ex.Message}");
            return StatusCode(500, "Fehler bei der E-Mail-Suche");
        }
    }

    /// <summary>
    /// 🆕 User existiert check (für Frontend-Validierung)
    /// GET /api/user/exists?userId=...
    /// </summary>
    [HttpGet("exists")]
    public async Task<ActionResult<bool>> UserExists([FromQuery] string userId)
    {
        try
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("User-ID ist erforderlich");
            }

            var exists = await _db.Users.AnyAsync(u => u.Id == userId && !u.IsDeleted);
            return Ok(exists);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Fehler beim Prüfen der User-Existenz {userId}: {ex.Message}");
            return StatusCode(500, "Fehler bei der User-Prüfung");
        }
    }
}