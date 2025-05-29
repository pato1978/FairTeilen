using Microsoft.AspNetCore.Mvc;
using WebAssembly.Server.Models;
using WebAssembly.Server.Services;

namespace WebAssembly.Server.Controllers;


    // Datei: Controllers/YearOverviewController.cs
    [ApiController]
    [Route("api/[controller]")]
    public class YearOverviewController : ControllerBase
    {
        private readonly YearOverviewService _yearOverviewService;

        public YearOverviewController(YearOverviewService yearOverviewService)
        {
            _yearOverviewService = yearOverviewService;
        }

        [HttpGet("{year}")]
        public async Task<ActionResult<YearOverview>> GetYearOverview(int year,[FromQuery] string userId)
        {
            var result = await _yearOverviewService.GetOverviewForYearAsync(year,  userId );
            return Ok(result);
        }
    }
