using StackExchange.Redis;

namespace StudienPlaner.Middleware;

/// <summary>
/// Rate limiting middleware using Redis sliding window.
/// Limits /api/schedule endpoints to 10 requests per minute per user/IP.
/// </summary>
public class RateLimitMiddleware(RequestDelegate next, IConnectionMultiplexer redis, ILogger<RateLimitMiddleware> logger)
{
    private const int MaxRequests = 10;
    private static readonly TimeSpan WindowSize = TimeSpan.FromMinutes(1);

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api/schedule"))
        {
            await next(context);
            return;
        }

        var identifier = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? context.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous";

        var key = $"ratelimit:schedule:{identifier}";
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var windowStart = now - (long)WindowSize.TotalMilliseconds;

        try
        {
            var db = redis.GetDatabase();

            // Sliding window using sorted set
            var transaction = db.CreateTransaction();
            _ = transaction.SortedSetRemoveRangeByScoreAsync(key, 0, windowStart);
            _ = transaction.SortedSetAddAsync(key, now.ToString(), now);
            _ = transaction.KeyExpireAsync(key, WindowSize);
            await transaction.ExecuteAsync();

            var requestCount = await db.SortedSetLengthAsync(key);

            if (requestCount > MaxRequests)
            {
                logger.LogWarning("Rate limit exceeded for {Identifier}", identifier);
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.Headers.RetryAfter = "60";
                await context.Response.WriteAsync("Rate limit exceeded. Try again in 60 seconds.");
                return;
            }
        }
        catch (Exception ex)
        {
            // Fail open — don't block requests if Redis is unavailable
            logger.LogWarning(ex, "Redis rate limit check failed, allowing request");
        }

        await next(context);
    }
}
