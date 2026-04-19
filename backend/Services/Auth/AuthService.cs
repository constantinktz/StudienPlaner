using Microsoft.EntityFrameworkCore;
using StudienPlaner.Database;
using StudienPlaner.Database.Entities;
using StudienPlaner.Models.Requests;
using StudienPlaner.Models.Responses;
using StudienPlaner.Services.Encryption;
using StudienPlaner.Services.Schedule;

namespace StudienPlaner.Services.Auth;

/// <summary>Handles user authentication and profile management.</summary>
public class AuthService(
    AppDbContext db,
    JwtService jwtService,
    EncryptionService encryptionService,
    MatrikelKeyResolverService matrikelResolver,
    ILogger<AuthService> logger)
{
    /// <summary>Registers a new user and returns auth tokens.</summary>
    public async Task<(UserEntity user, string accessToken, string refreshToken)> RegisterAsync(
        RegisterRequest request, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email, ct))
            throw new InvalidOperationException("A user with this email already exists.");

        if (await db.Users.AnyAsync(u => u.MatrikelNumber == request.MatrikelNumber, ct))
            throw new InvalidOperationException("A user with this Matrikel number already exists.");

        var (courseKey, estimatedSemester) = matrikelResolver.ResolveMatrikel(request.MatrikelNumber);

        var user = new UserEntity
        {
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            MatrikelNumber = request.MatrikelNumber,
            CourseKey = courseKey,
            CurrentSemester = estimatedSemester
        };

        var refreshToken = jwtService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("New user registered: {Email}", user.Email);

        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Email);
        return (user, accessToken, refreshToken);
    }

    /// <summary>Authenticates a user and returns auth tokens.</summary>
    public async Task<(UserEntity user, string accessToken, string refreshToken)> LoginAsync(
        LoginRequest request, CancellationToken ct = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(
            u => u.Email == request.Email.ToLowerInvariant(), ct)
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var refreshToken = jwtService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await db.SaveChangesAsync(ct);

        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Email);
        return (user, accessToken, refreshToken);
    }

    /// <summary>Saves encrypted FH portal credentials for a user.</summary>
    public async Task SetPortalCredentialsAsync(Guid userId, string fhUsername, string fhPassword,
        CancellationToken ct = default)
    {
        var user = await db.Users.FindAsync([userId], ct)
            ?? throw new KeyNotFoundException("User not found.");

        var (encUsername, ivUsername) = encryptionService.Encrypt(fhUsername);
        var (encPassword, ivPassword) = encryptionService.Encrypt(fhPassword);

        // Store both IVs concatenated with a separator
        user.FhUsernameEnc = encUsername;
        user.FhPasswordEnc = encPassword;
        user.FhIv = $"{ivUsername}|{ivPassword}";

        await db.SaveChangesAsync(ct);
    }

    /// <summary>Retrieves and decrypts the FH portal credentials for a user.</summary>
    public async Task<(string username, string password)?> GetPortalCredentialsAsync(
        Guid userId, CancellationToken ct = default)
    {
        var user = await db.Users.FindAsync([userId], ct);

        if (user?.FhUsernameEnc == null || user.FhPasswordEnc == null || user.FhIv == null)
            return null;

        var ivParts = user.FhIv.Split('|');
        if (ivParts.Length != 2) return null;

        var username = encryptionService.Decrypt(user.FhUsernameEnc, ivParts[0]);
        var password = encryptionService.Decrypt(user.FhPasswordEnc, ivParts[1]);
        return (username, password);
    }

    /// <summary>Clears stored FH portal credentials for a user.</summary>
    public async Task ClearPortalCredentialsAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await db.Users.FindAsync([userId], ct)
            ?? throw new KeyNotFoundException("User not found.");

        user.FhUsernameEnc = null;
        user.FhPasswordEnc = null;
        user.FhIv = null;
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Returns the profile DTO for a given user.</summary>
    public async Task<UserProfileDto> GetUserProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await db.Users.FindAsync([userId], ct)
            ?? throw new KeyNotFoundException("User not found.");

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.MatrikelNumber,
            user.CourseKey,
            user.CurrentSemester,
            user.StudentGroup,
            user.FhUsernameEnc != null,
            user.CreatedAt
        );
    }

    /// <summary>Updates editable profile fields for a user.</summary>
    public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request,
        CancellationToken ct = default)
    {
        var user = await db.Users.FindAsync([userId], ct)
            ?? throw new KeyNotFoundException("User not found.");

        if (request.CourseKey is not null) user.CourseKey = request.CourseKey;
        if (request.CurrentSemester is not null) user.CurrentSemester = request.CurrentSemester;
        if (request.StudentGroup is not null) user.StudentGroup = request.StudentGroup;

        await db.SaveChangesAsync(ct);
        return await GetUserProfileAsync(userId, ct);
    }
}
