using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VisitorManagement.Api.Data;

namespace VisitorManagement.Api.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/reports/visitor-logs?visitorId=1&startDate=2025-01-01&endDate=2025-02-01
        [HttpGet("visitor-logs")]
        public async Task<IActionResult> GetVisitorLogsReport(
            [FromQuery] int? visitorId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var query = _context.VisitorLogs
                .Include(l => l.Visitor)
                .AsQueryable();

            if (visitorId.HasValue && visitorId > 0)
            {
                query = query.Where(l => l.Visitor.Id == visitorId);
            }

            if (startDate.HasValue)
            {
                query = query.Where(l => l.EntryTime >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(l => l.EntryTime <= endDate.Value);
            }

            var logs = await query
                .OrderByDescending(l => l.EntryTime)
                .Select(l => new
                {
                    l.Id,
                    VisitorName = l.Visitor.FullName,
                    l.EntryTime,
                    l.ExitTime
                })
                .ToListAsync();

            if (!logs.Any())
                return NotFound("Belirtilen kriterlerde log bulunamadı.");

            return Ok(logs);
        }
    }
}
