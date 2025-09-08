using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using VisitorManagement.Api.DTOs;
using VisitorManagement.Api.Entities;

namespace VisitorManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // JWT ile giriş yapmış kullanıcılar
    public class AdminController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            // Token'dan kullanıcı adını çek
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(username))
                return Unauthorized(new { message = "Token geçersiz veya kullanıcı adı bulunamadı." });

            var user = await _userManager.FindByNameAsync(username);
            if (user == null)
                return NotFound(new { message = "Kullanıcı bulunamadı" });

            return Ok(new
            {
                user.UserName,
                user.FullName,
                user.Email,
                user.Role,
                user.Theme,
                user.CreatedAt
            });
        }


        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
        {
            if (string.IsNullOrWhiteSpace(model.CurrentPassword) || string.IsNullOrWhiteSpace(model.NewPassword))
                return BadRequest(new { message = "Eski ve yeni şifre alanları zorunludur." });

            // Token'dan kullanıcı adını çek
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(username))
                return Unauthorized(new { message = "Token geçersiz veya kullanıcı adı bulunamadı." });

            var user = await _userManager.FindByNameAsync(username);
            if (user == null)
                return NotFound(new { message = "Kullanıcı bulunamadı." });

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Şifre değiştirme başarısız.",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            return Ok(new { message = "Şifre başarıyla değiştirildi." });
        }


        [HttpPost("change-theme")]
        public async Task<IActionResult> ChangeTheme([FromBody] ChangeThemeDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Theme))
                return BadRequest(new { message = "Tema bilgisi boş olamaz." });

            // Token'dan kullanıcı adını çek
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(username))
                return Unauthorized(new { message = "Token geçersiz veya kullanıcı adı bulunamadı." });

            var user = await _userManager.FindByNameAsync(username);
            if (user == null)
                return NotFound(new { message = "Kullanıcı bulunamadı." });

            user.Theme = model.Theme;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Tema değiştirme başarısız.",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            return Ok(new { message = "Tema başarıyla değiştirildi.", newTheme = user.Theme });
        }

        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
        {
            if (string.IsNullOrWhiteSpace(model.FullName) || string.IsNullOrWhiteSpace(model.Email))
                return BadRequest(new { message = "Ad soyad ve e-posta zorunludur." });

            // Token'dan kullanıcı adını al
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(username))
                return Unauthorized(new { message = "Token geçersiz veya kullanıcı adı bulunamadı." });

            var user = await _userManager.FindByNameAsync(username);
            if (user == null)
                return NotFound(new { message = "Kullanıcı bulunamadı." });

            user.FullName = model.FullName;
            user.Email = model.Email;
            user.UserName = username; // kullanıcı adını değiştirmiyoruz

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Profil güncelleme başarısız.",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            return Ok(new
            {
                message = "Profil başarıyla güncellendi.",
                updatedProfile = new
                {
                    user.UserName,
                    user.FullName,
                    user.Email,
                    user.Role,
                    user.Theme,
                    user.CreatedAt
                }
            });
        }

    }
}
