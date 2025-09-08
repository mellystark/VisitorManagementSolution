using System;

namespace VisitorManagement.Api.Entities
{
    public class VisitorLog
    {
        public int Id { get; set; }

        public int VisitorId { get; set; }    // FK - Visitor tablosuna bağlanır
        public Visitor Visitor { get; set; }  // Navigation property

        public DateTime EntryTime { get; set; } = DateTime.UtcNow;

        public DateTime? ExitTime { get; set; }

        public string? Source { get; set; }    // Örn: "mobile", "kiosk"

        public string? Metadata { get; set; }  // İsteğe bağlı ek bilgiler (cihaz, ip vb.)
    }
}
