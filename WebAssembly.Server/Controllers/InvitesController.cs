using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using WebAssembly.Server.Models;
using WebAssembly.Server.Services;

namespace WebAssembly.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvitesController : ControllerBase
    {
        private readonly IInviteService _invites;
        private readonly IAuthService _auth;
        private readonly ILogger<InvitesController> _log;

        public InvitesController(IInviteService invites, IAuthService auth, ILogger<InvitesController> log)
        {
            _invites = invites;
            _auth = auth;
            _log = log;
        }

        [Authorize]
        [HttpPost("create")]
        public async Task<ActionResult<InviteResponse>> Create([FromBody] CreateInviteRequest req)
        {
            var uid = User.FindFirstValue("uid");
            var res = await _invites.CreateAsync(uid!, req.ExpiresInHours);
            return Ok(res);
        }

        [HttpPost("accept")]
        public async Task<ActionResult<AuthResponse>> Accept([FromBody] AcceptInviteRequest req)
        {
            var user = await _invites.AcceptAsync(req);
            var login = await _auth.LoginAsync(new LoginRequest { Email = req.Email, Password = req.Password });
            return Ok(login);
        }
    }
}

