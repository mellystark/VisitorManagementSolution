using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using VisitorManagement.Api.Data;
using OfficeOpenXml;
using System.Text;
using Microsoft.AspNetCore.SignalR;
using VisitorManagement.Api.Hubs;

namespace VisitorManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<StatsHub> _hubContext;

        public StatsController(ApplicationDbContext context, IHubContext<StatsHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var totalVisitors = await _context.Visitors.CountAsync();

            var today = DateTime.UtcNow.Date;
            var dailyEntries = await _context.VisitorLogs
                .CountAsync(l => l.EntryTime >= today);

            var dailyExits = await _context.VisitorLogs
                .CountAsync(l => l.ExitTime != null && l.ExitTime >= today);

            var stats = new
            {
                TotalVisitors = totalVisitors,
                DailyEntries = dailyEntries,
                DailyExits = dailyExits
            };

            // İstatistikleri tüm clientlara gönder
            await _hubContext.Clients.All.SendAsync("ReceiveStatsUpdate", stats);

            return Ok(stats);
        }


        [HttpPost("update")]
        public async Task<IActionResult> UpdateStats()
        {
            // Mevcut istatistikleri hesapla
            var totalVisitors = await _context.Visitors.CountAsync();

            var today = DateTime.UtcNow.Date;
            var dailyEntries = await _context.VisitorLogs
                .CountAsync(l => l.EntryTime >= today);

            var dailyExits = await _context.VisitorLogs
                .CountAsync(l => l.ExitTime != null && l.ExitTime >= today);

            var stats = new
            {
                TotalVisitors = totalVisitors,
                DailyEntries = dailyEntries,
                DailyExits = dailyExits
            };

            // SignalR ile tüm bağlı client'lara gönder
            await _hubContext.Clients.All.SendAsync("ReceiveStatsUpdate", stats);

            return Ok(new { message = "İstatistikler güncellendi ve client'lara iletildi.", stats });
        }


        [HttpGet("export-csv")]
        public async Task<IActionResult> ExportStatsToCsv()
        {
            var totalVisitors = await _context.Visitors.CountAsync();
            var today = DateTime.UtcNow.Date;
            var dailyEntries = await _context.VisitorLogs.CountAsync(l => l.EntryTime >= today);
            var dailyExits = await _context.VisitorLogs.CountAsync(l => l.ExitTime != null && l.ExitTime >= today);

            var csv = new StringBuilder();
            csv.AppendLine("Total Visitors;Daily Entries;Daily Exits;Report Date");

            csv.AppendLine(
                $"{totalVisitors};" +
                $"{dailyEntries};" +
                $"{dailyExits};" +
                $"{ForceQuote(DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm"))}"
            );

            // UTF8 BOM ekle
            var preamble = Encoding.UTF8.GetPreamble();
            var bytesWithoutBom = Encoding.UTF8.GetBytes(csv.ToString());
            var bytes = new byte[preamble.Length + bytesWithoutBom.Length];
            Buffer.BlockCopy(preamble, 0, bytes, 0, preamble.Length);
            Buffer.BlockCopy(bytesWithoutBom, 0, bytes, preamble.Length, bytesWithoutBom.Length);

            return File(bytes, "text/csv", $"Stats_{DateTime.Now:yyyyMMdd_HHmm}.csv");
        }

        private string ForceQuote(string field)
        {
            if (field == null) return "";
            var escaped = field.Replace("\"", "\"\"");
            return $"\"{escaped}\"";
        }
    }
}