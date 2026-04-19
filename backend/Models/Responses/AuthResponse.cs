namespace StudienPlaner.Models.Responses;

/// <summary>Response returned after successful authentication.</summary>
public record AuthResponse(
    Guid UserId,
    string Email,
    string AccessToken
);
