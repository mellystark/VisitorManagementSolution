using Microsoft.AspNetCore.Identity;
using System;

namespace VisitorManagement.Api.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public string Role { get; set; } = "Admin";  // Default rol Admin
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? FullName { get; set; }
        public string? Theme { get; set; }

        // IdentityUser zaten içinde Username, PasswordHash, Email var
    }
}
