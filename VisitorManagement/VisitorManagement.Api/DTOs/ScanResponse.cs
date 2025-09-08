using System;

namespace VisitorManagement.Api.DTOs
{
    public class ScanResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public VisitorDto Visitor { get; set; }
        public int? LogId { get; set; }
        public DateTime? EntryTime { get; set; }
        public DateTime? ExitTime { get; set; }
    }
}
