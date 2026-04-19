using System.Security.Cryptography;
using System.Text;

namespace StudienPlaner.Services.Encryption;

/// <summary>Provides AES-256-GCM encryption and decryption for sensitive data.</summary>
public class EncryptionService
{
    private readonly byte[] _key;

    public EncryptionService(IConfiguration configuration)
    {
        var hexKey = configuration["Encryption:Key"]
            ?? Environment.GetEnvironmentVariable("ENCRYPTION_KEY")
            ?? throw new InvalidOperationException("Encryption key is not configured.");

        if (hexKey.Length != 64)
            throw new InvalidOperationException("Encryption key must be a 64-character hex string (32 bytes).");

        _key = Convert.FromHexString(hexKey);
    }

    /// <summary>Encrypts plaintext using AES-256-GCM with a random 12-byte nonce.</summary>
    /// <param name="plaintext">The text to encrypt.</param>
    /// <returns>A tuple of (ciphertext_base64, iv_base64).</returns>
    public (string CiphertextBase64, string IvBase64) Encrypt(string plaintext)
    {
        var nonce = new byte[AesGcm.NonceByteSizes.MaxSize]; // AES-GCM recommended nonce size (96 bits)
        RandomNumberGenerator.Fill(nonce);

        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var ciphertext = new byte[plaintextBytes.Length];
        var tag = new byte[AesGcm.TagByteSizes.MaxSize]; // 16 bytes

        using var aesGcm = new AesGcm(_key, AesGcm.TagByteSizes.MaxSize);
        aesGcm.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        // Combine ciphertext + tag for storage
        var combined = new byte[ciphertext.Length + tag.Length];
        Buffer.BlockCopy(ciphertext, 0, combined, 0, ciphertext.Length);
        Buffer.BlockCopy(tag, 0, combined, ciphertext.Length, tag.Length);

        return (Convert.ToBase64String(combined), Convert.ToBase64String(nonce));
    }

    /// <summary>Decrypts a base64-encoded ciphertext using AES-256-GCM.</summary>
    /// <param name="ciphertextBase64">Base64-encoded ciphertext + GCM tag.</param>
    /// <param name="ivBase64">Base64-encoded 12-byte nonce.</param>
    /// <returns>The decrypted plaintext string.</returns>
    public string Decrypt(string ciphertextBase64, string ivBase64)
    {
        var combined = Convert.FromBase64String(ciphertextBase64);
        var nonce = Convert.FromBase64String(ivBase64);

        const int tagSize = 16;
        var ciphertext = combined[..^tagSize];
        var tag = combined[^tagSize..];

        var plaintext = new byte[ciphertext.Length];

        using var aesGcm = new AesGcm(_key, AesGcm.TagByteSizes.MaxSize);
        aesGcm.Decrypt(nonce, ciphertext, tag, plaintext);

        return Encoding.UTF8.GetString(plaintext);
    }
}
