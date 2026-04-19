using System.ComponentModel.DataAnnotations;

namespace StudienPlaner.Models.Requests;

/// <summary>Request body for user login.</summary>
public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);
