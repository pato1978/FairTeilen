using WebAssembly.Server.Models;

namespace WebAssembly.Server.Services;

public interface IInviteService
{
    Task<InviteResponse> CreateAsync(string inviterUserId, int? expiresInHours);
    Task<AppUser> AcceptAsync(AcceptInviteRequest req);
}

