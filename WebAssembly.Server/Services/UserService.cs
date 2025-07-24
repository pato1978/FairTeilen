using Microsoft.EntityFrameworkCore;
using WebAssembly.Server.Data;
using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

public class UserService
{
    private readonly SharedDbContext _db;

    public UserService(SharedDbContext db)
    {
        _db = db;
    }

    public async Task<AppUser> EnsureUserExistsAsync(string userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            user = new AppUser
            {
                Id = userId,
                DisplayName = $"User_{userId[..6]}"
                // Optional: andere Defaults
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }

        return user;
    }

    public async Task<AppUser?> GetUserByEmailAsync(string email)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
    }
}