using Microsoft.AspNetCore.Mvc;

namespace WebAssembly.Server.Controllers;


    [ApiController]
    [Route("api/[controller]")]
    public class CurrentMonthController : ControllerBase
    {
        // Temporärer Speicher – später ggf. pro Benutzer oder in DB
        private static string _currentMonthIso = DateTime.UtcNow.ToString("yyyy-MM-dd");

        // POST: /api/currentmonth
        [HttpPost]
        public IActionResult SetMonth([FromBody] MonthDto data)
        {
            if (string.IsNullOrEmpty(data.Month))
            {
                return BadRequest("Monatswert fehlt");
            }

            _currentMonthIso = data.Month;
            Console.WriteLine($"Aktueller Monat vom Frontend gesetzt: {_currentMonthIso}");

            return Ok(new { status = "Month received", month = _currentMonthIso });
        }

        // GET: /api/currentmonth
        [HttpGet]
        public IActionResult GetMonth()
        {
            return Ok(new { month = _currentMonthIso });
        }

        public class MonthDto
        {
            public string Month { get; set; } = "";
        }
    }
