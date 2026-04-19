using System.ComponentModel.DataAnnotations;

namespace StudienPlaner.Models.Requests;

/// <summary>Request body for user registration.</summary>
public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string MatrikelNumber
);
