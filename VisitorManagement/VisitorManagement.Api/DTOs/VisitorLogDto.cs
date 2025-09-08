using System;

namespace VisitorManagement.Api.DTOs
{
    public class VisitorLogDto
    {
        public int Id { get; set; }
        public int VisitorId { get; set; }
        public DateTime EntryTime { get; set; }
        public DateTime? ExitTime { get; set; }
        public string? Metadata { get; set; }
    }
}
