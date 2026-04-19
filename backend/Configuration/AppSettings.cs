namespace StudienPlaner.Configuration;

/// <summary>JWT configuration settings.</summary>
public class JwtSettings
{
    public string Secret { get; set; } = "";
    public string Issuer { get; set; } = "StudienPlaner";
    public string Audience { get; set; } = "StudienPlaner";
}

/// <summary>Redis configuration settings.</summary>
public class RedisSettings
{
    public string ConnectionString { get; set; } = "";
}

/// <summary>Encryption configuration settings.</summary>
public class EncryptionSettings
{
    public string Key { get; set; } = "";
}

/// <summary>CORS configuration settings.</summary>
public class CorsSettings
{
    public string[] AllowedOrigins { get; set; } = [];
}

/// <summary>Root application settings.</summary>
public class AppSettings
{
    public JwtSettings Jwt { get; set; } = new();
    public RedisSettings Redis { get; set; } = new();
    public EncryptionSettings Encryption { get; set; } = new();
    public CorsSettings Cors { get; set; } = new();
}
