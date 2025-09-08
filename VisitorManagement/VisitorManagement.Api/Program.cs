using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using VisitorManagement.Api.Data;
using VisitorManagement.Api.Entities;
using VisitorManagement.Api.Hubs;
using VisitorManagement.Api.Services;


var builder = WebApplication.CreateBuilder(args);

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins, policy =>
    {
        //policy.WithOrigins(
        //    "http://localhost:5173",      // Vite/React web frontend admin
        //     "http://localhost:5174",      // visitor-portal 
        //    "http://localhost:19006",     // Expo web preview
        //    "http://192.168.1.100:19006", // kendi cihazýndan Expo (örnek IP)
        //    "exp://192.168.1.100:19000",  // Expo Go app
        //    "http://192.168.1.100:8081",   // RN Metro Bundler
        //    "http://192.168.1.112:19006", // Expo web preview (LAN IP)
        //    "http://192.168.1.112:7023",  // API'ye doðrudan istek (LAN IP)
        //    "http://10.0.2.2:7023"

        //)
        //.AllowAnyHeader()
        //.AllowAnyMethod()
        //.AllowCredentials();

        policy.AllowAnyOrigin()
      .AllowAnyHeader()
      .AllowAnyMethod();

    });
});



// Add services to the container.
// 1. Connection String
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 2. DbContext & Identity
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddTransient<IEmailService, EmailService>();


builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// 3. JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuerSigningKey = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Visitor Management API",
        Version = "v1",
        Description = "QR Kod tabanlý ziyaretçi yönetim sistemi API dokümantasyonu"
    });

    // JWT desteði
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Bearer {token} formatýnda JWT giriniz"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});


var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await DbSeeder.SeedAdminUserAsync(services);
        Console.WriteLine("Admin kullanýcý baþarýyla oluþturuldu veya zaten mevcut.");
    }
    catch (Exception ex)
    {
        Console.WriteLine("Admin kullanýcý oluþturulurken hata: " + ex.Message);
    }
}


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Visitor Management API v1");
    });
}


app.UseHttpsRedirection();
app.UseCors(MyAllowSpecificOrigins);
app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();
app.UseCors("AllowAll");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<VisitorManagement.Api.Hubs.VisitorHub>("/visitorHub");
app.MapHub<StatsHub>("/hubs/stats");

app.Run();

public partial class Program { }

