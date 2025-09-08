using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.IdentityModel.Tokens;
using VisitorManagement.Api.DTOs;
using Xunit;

namespace VisitorManagement.Api.Tests
{
    public class VisitorTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public VisitorTests(WebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();

            // Test JWT üretip Authorization header'a ekliyoruz
            var token = GenerateTestJwtToken();
            _client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }

        [Fact]
        public async Task Can_Create_Visitor()
        {
            Console.WriteLine("TEST: Yeni ziyaretçi oluşturma testi başlıyor...");

            var dto = new CreateVisitorDto
            {
                FullName = "Melly Stark",
                Email = "melly@gmail.com",
                PhoneNumber = "+905586975418"
            };

            var response = await _client.PostAsJsonAsync("/api/Visitor", dto);

            Console.WriteLine($"HTTP Durumu: {(int)response.StatusCode} {response.StatusCode}");
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            Console.WriteLine("Yeni ziyaretçi oluşturuldu ve başarılı yanıt alındı.");
        }

        [Fact]
        public async Task Can_Login_And_Get_Token()
        {
            Console.WriteLine("TEST: Admin kullanıcı login testi başlıyor...");

            var loginDto = new LoginRequest
            {
                Username = "admin",
                Password = "Admin123!"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/login", loginDto);
            Console.WriteLine($"HTTP Durumu: {(int)response.StatusCode} {response.StatusCode}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
            Assert.False(string.IsNullOrEmpty(authResponse?.Token));

            Console.WriteLine($"Token alındı: {authResponse?.Token[..20]}... (kısaltıldı)");
        }

        [Fact]
        public async Task Can_Get_Visitor_QRCode()
        {
            Console.WriteLine("TEST: Visitor QR kod alma testi başlıyor...");

            // Öncelikle visitor oluşturuyoruz
            var dto = new CreateVisitorDto
            {
                FullName = "QR Test User",
                Email = "qrtest@example.com",
                PhoneNumber = "555-1234"
            };
            var createResponse = await _client.PostAsJsonAsync("/api/Visitor", dto);
            Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

            var visitor = await createResponse.Content.ReadFromJsonAsync<VisitorDto>();
            Assert.NotNull(visitor);

            // QR kodunu çekiyoruz
            var qrResponse = await _client.GetAsync($"/api/Visitor/{visitor.Id}/qrcode");
            Console.WriteLine($"HTTP Durumu: {(int)qrResponse.StatusCode} {qrResponse.StatusCode}");

            Assert.Equal("image/png", qrResponse.Content.Headers.ContentType?.MediaType);

            Console.WriteLine("QR kod resmi başarılı şekilde alındı.");
        }

        private string GenerateTestJwtToken()
        {
            var secretKey = "BuCokGizliBirJwtAnahtariOlmali123456!";
            var issuer = "VisitorManagementAPI";
            var audience = "VisitorManagementClient";

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, "test-user"),
                new Claim(ClaimTypes.Role, "Admin"), // Admin yetkisi
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(60),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
