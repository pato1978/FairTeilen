
using Microsoft.AspNetCore.Mvc;
using WebAssembly.Server.Helper;

namespace WebAssembly.Server.Controllers;

[ApiController]
    [Route("api/[controller]")]
    public class FinancialDataController : ControllerBase
    {
        private readonly FinanceCalculatorHelper _financeCalculatorHelper = new FinanceCalculatorHelper();

        [HttpGet]
        public IActionResult Get()
        {   
            var personalSpent = 850;
            var personalTotal = 1200;
            var personalPercentage = _financeCalculatorHelper.CalculatePercentage(personalSpent, personalTotal);
            
            var sharedSpent = 620;  
            var sharedTotal = 1500;
            var sharedPercentage = _financeCalculatorHelper.CalculatePercentage(sharedSpent, sharedTotal);
            
            var childSpent = 360;
            var childTotal = 1200;
            var childPercentage = _financeCalculatorHelper.CalculatePercentage(childSpent, childTotal);

            var data = new
            {
                personalBudget = new { spent = personalSpent, total = personalTotal, percentage = personalPercentage },
                sharedBudget = new { spent = sharedSpent, total = sharedTotal, percentage = sharedPercentage },
                childBudget = new { spent = childSpent, total = childTotal, percentage = childPercentage }
            };
            

            return Ok(data);
        }
    }
