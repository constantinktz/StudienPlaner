using System.ComponentModel.DataAnnotations;

namespace StudienPlaner.Models.Requests;

/// <summary>Request body for FH portal credential submission.</summary>
public record PortalLoginRequest(
    [Required] string FhUsername,
    [Required] string FhPassword
);
