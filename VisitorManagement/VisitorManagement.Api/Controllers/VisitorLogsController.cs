using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using VisitorManagement.Api.Data;
using VisitorManagement.Api.DTOs;

namespace VisitorManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // admin erişimi
    public class VisitorLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VisitorLogsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/VisitorLogs
        [HttpGet]
        public async Task<IActionResult> GetAllLogs()
        {
            var logs = await _context.VisitorLogs
                .Include(l => l.Visitor)
                .OrderByDescending(l => l.EntryTime)
                .Select(l => new VisitorLogDto
                {
                    Id = l.Id,
                    VisitorId = l.VisitorId,
                    EntryTime = l.EntryTime,
                    ExitTime = l.ExitTime,
                    Metadata = l.Metadata
                })
                .ToListAsync();

            return Ok(logs);
        }

        // PUT: api/VisitorLogs/{id}/exit
        [HttpPut("{id}/exit")]
        public async Task<IActionResult> MarkExit(int id)
        {
            var log = await _context.VisitorLogs.FindAsync(id);
            if (log == null)
                return NotFound("Log kaydı bulunamadı.");

            if (log.ExitTime != null)
                return BadRequest("Bu kayıt zaten çıkış yapmış.");

            log.ExitTime = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Çıkış zamanı eklendi.", logId = log.Id });
        }
    }
}
