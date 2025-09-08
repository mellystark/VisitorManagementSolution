using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace VisitorManagement.Api.Entities
{
    public class Visitor
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string FullName { get; set; }

        [MaxLength(200)]
        public string? Email { get; set; }

        [MaxLength(50)]
        public string? PhoneNumber { get; set; }

        [Required]
        [MaxLength(200)]
        public string QrCodeData { get; set; }  // GUID string olarak saklanacak

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        // Foreign Key: Davete bağlılık
        public int InvitationId { get; set; }
        public Invitation Invitation { get; set; }

        // Navigation property — bir ziyaretçinin birçok giriş çıkış kaydı olabilir
        public ICollection<VisitorLog> VisitorLogs { get; set; } = new List<VisitorLog>();
    }
}
