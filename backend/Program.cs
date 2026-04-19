using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using StudienPlaner;
using StudienPlaner.Database;
using StudienPlaner.Endpoints;
using StudienPlaner.Middleware;
using StudienPlaner.Services.Auth;
using StudienPlaner.Services.Encryption;
using StudienPlaner.Services.Planner;
using StudienPlaner.Services.Portal;
using StudienPlaner.Services.Schedule;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration overrides from environment ─────────────────────────────────
var config = builder.Configuration;
if (Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") is { } pgPass)
    config["ConnectionStrings:Postgres"] = config["ConnectionStrings:Postgres"]!
        .Replace("${POSTGRES_PASSWORD}", pgPass);
if (Environment.GetEnvironmentVariable("JWT_SECRET") is { } jwtSecret)
    config["Jwt:Secret"] = jwtSecret;
if (Environment.GetEnvironmentVariable("REDIS_CONNECTION") is { } redisConn)
    config["Redis:ConnectionString"] = redisConn;
if (Environment.GetEnvironmentVariable("ENCRYPTION_KEY") is { } encKey)
    config["Encryption:Key"] = encKey;

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(config.GetConnectionString("Postgres")));

// ── Redis ─────────────────────────────────────────────────────────────────────
var redisConnectionString = config["Redis:ConnectionString"] ?? "localhost:6379";
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(redisConnectionString));

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtSecretValue = config["Jwt:Secret"] ?? "dev-secret-change-this-to-something-long-and-secure-32chars";
var jwtIssuer = config["Jwt:Issuer"] ?? "StudienPlaner";
var jwtAudience = config["Jwt:Audience"] ?? "StudienPlaner";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretValue)),
            ClockSkew = TimeSpan.Zero
        };

        // Read JWT from HttpOnly cookie
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.TryGetValue("access_token", out var token))
                    context.Token = token;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins = config.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];

builder.Services.AddCors(opts =>
    opts.AddPolicy("FrontendPolicy", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

// ── HttpClient ────────────────────────────────────────────────────────────────
builder.Services.AddHttpClient("FhApi", client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// ── Application Services ──────────────────────────────────────────────────────
builder.Services.AddSingleton<EncryptionService>();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<MatrikelKeyResolverService>();
builder.Services.AddScoped<ScheduleService>();
builder.Services.AddScoped<FhPortalScraper>();
builder.Services.AddScoped<FhPortalService>();
builder.Services.AddSingleton<RecommendationEngine>();
builder.Services.AddScoped<PlannerService>();

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opts =>
{
    opts.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "StudienPlaner API",
        Version = "v1",
        Description = "Backend API for the FH Dortmund Study Planner application"
    });

    opts.AddSecurityDefinition("cookieAuth", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Cookie,
        Name = "access_token",
        Description = "JWT access token stored in HttpOnly cookie"
    });

    opts.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "cookieAuth" }
            },
            []
        }
    });
});

var app = builder.Build();

// ── Auto-migrate ──────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        var log = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        log.LogWarning(ex, "Database migration failed — database may not be available yet");
    }
}

// ── Middleware pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<RateLimitMiddleware>();

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(opts =>
    {
        opts.SwaggerEndpoint("/swagger/v1/swagger.json", "StudienPlaner API v1");
        opts.RoutePrefix = "swagger";
    });
}

// ── Endpoints ─────────────────────────────────────────────────────────────────
app.MapGet("/health", () => Results.Ok("OK"))
    .WithTags("Health")
    .WithName("HealthCheck")
    .Produces<string>();

app.MapAuthEndpoints();
app.MapScheduleEndpoints();
app.MapPortalEndpoints();
app.MapPlannerEndpoints();
app.MapUserEndpoints();

app.Run();
