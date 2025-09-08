using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;
using VisitorManagement.Api.Entities;

namespace VisitorManagement.Api.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAdminUserAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            string adminUserName = "admin";
            string adminEmail = "admin@example.com";
            string adminPassword = "Admin123!"; // Gerekirse daha güçlü yap

            var adminUser = await userManager.FindByNameAsync(adminUserName);
            if (adminUser == null)
            {
                var user = new ApplicationUser
                {
                    UserName = adminUserName,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    Role = "Admin",
                    CreatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(user, adminPassword);
                if (!result.Succeeded)
                {
                    throw new Exception("Admin kullanıcısı oluşturulamadı: " + string.Join(", ", result.Errors));
                }

                // İstersen rol ataması yapılabilir, ama Role alanını ApplicationUser’da tutuyoruz.
            }
        }
    }
}
