using System.Text.Json;
using StackExchange.Redis;
using StudienPlaner.Models.Responses;

namespace StudienPlaner.Services.Schedule;

/// <summary>Provides schedule data from the FH Dortmund web service with Redis caching.</summary>
public class ScheduleService(
    IHttpClientFactory httpClientFactory,
    IConnectionMultiplexer redis,
    ILogger<ScheduleService> logger)
{
    private const string FhApiBase = "https://ws.inf.fh-dortmund.de/fbws/current/rest";
    private static readonly TimeSpan CoursesCacheDuration = TimeSpan.FromHours(1);
    private static readonly TimeSpan ScheduleCacheDuration = TimeSpan.FromMinutes(30);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    /// <summary>Returns all available courses of study, cached for 1 hour.</summary>
    public async Task<List<CourseOfStudyDto>> GetCoursesAsync(CancellationToken ct = default)
    {
        const string cacheKey = "courses";
        var db = redis.GetDatabase();
        var cached = await db.StringGetAsync(cacheKey);

        if (cached.HasValue)
        {
            try
            {
                return JsonSerializer.Deserialize<List<CourseOfStudyDto>>(cached!, JsonOptions) ?? [];
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to deserialize cached courses");
            }
        }

        var courses = await FetchCoursesFromApiAsync(ct);

        await db.StringSetAsync(cacheKey, JsonSerializer.Serialize(courses), CoursesCacheDuration);
        return courses;
    }

    /// <summary>Returns schedule events for a given course, semester, and optional group, cached 30 min.</summary>
    public async Task<ScheduleQueryResult> GetScheduleAsync(
        string courseKey, int semester, string? group = null, CancellationToken ct = default)
    {
        var cacheKey = $"schedule:{courseKey}:{semester}:{group ?? "all"}";
        var db = redis.GetDatabase();
        var cached = await db.StringGetAsync(cacheKey);

        if (cached.HasValue)
        {
            try
            {
                var result = JsonSerializer.Deserialize<ScheduleQueryResult>(cached!, JsonOptions);
                if (result is not null) return result;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to deserialize cached schedule for {Key}", cacheKey);
            }
        }

        var events = await FetchScheduleFromApiAsync(courseKey, semester, group, ct);
        var queryResult = new ScheduleQueryResult(courseKey, semester, group, events, DateTime.UtcNow);

        await db.StringSetAsync(cacheKey, JsonSerializer.Serialize(queryResult), ScheduleCacheDuration);
        return queryResult;
    }

    /// <summary>Returns schedule data as an iCalendar string.</summary>
    public async Task<string> GetScheduleIcalAsync(
        string courseKey, int semester, string? group = null, CancellationToken ct = default)
    {
        var schedule = await GetScheduleAsync(courseKey, semester, group, ct);
        return BuildIcal(schedule);
    }

    private async Task<List<CourseOfStudyDto>> FetchCoursesFromApiAsync(CancellationToken ct)
    {
        try
        {
            var client = httpClientFactory.CreateClient("FhApi");
            var response = await client.GetAsync($"{FhApiBase}/courses", ct);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("FH API returned {StatusCode} for courses", response.StatusCode);
                return GetFallbackCourses();
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            var raw = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);

            var courses = new List<CourseOfStudyDto>();
            if (raw.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in raw.EnumerateArray())
                {
                    var key = item.TryGetProperty("key", out var k) ? k.GetString() ?? "" : "";
                    var name = item.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                    var faculty = item.TryGetProperty("faculty", out var f) ? f.GetString() ?? "" : "";
                    courses.Add(new CourseOfStudyDto(key, name, faculty));
                }
            }

            return courses.Count > 0 ? courses : GetFallbackCourses();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch courses from FH API");
            return GetFallbackCourses();
        }
    }

    private async Task<IReadOnlyList<ScheduleEventDto>> FetchScheduleFromApiAsync(
        string courseKey, int semester, string? group, CancellationToken ct)
    {
        try
        {
            var client = httpClientFactory.CreateClient("FhApi");
            var url = $"{FhApiBase}/schedule/{courseKey}/{semester}";
            if (!string.IsNullOrEmpty(group)) url += $"?group={Uri.EscapeDataString(group)}";

            var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("FH API returned {StatusCode} for schedule {Key}/{Sem}",
                    response.StatusCode, courseKey, semester);
                return [];
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            var raw = JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
            var events = new List<ScheduleEventDto>();

            if (raw.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in raw.EnumerateArray())
                {
                    var evt = ParseScheduleEvent(item);
                    if (evt is not null) events.Add(evt);
                }
            }

            return events;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch schedule from FH API");
            return [];
        }
    }

    private static ScheduleEventDto? ParseScheduleEvent(JsonElement item)
    {
        try
        {
            var title = item.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "";
            var room = item.TryGetProperty("room", out var r) ? r.GetString() : null;
            var lecturer = item.TryGetProperty("lecturer", out var l) ? l.GetString() : null;
            var eventType = item.TryGetProperty("type", out var et) ? et.GetString() : null;

            var dayStr = item.TryGetProperty("day", out var d) ? d.GetString() ?? "Monday" : "Monday";
            var startStr = item.TryGetProperty("startTime", out var s) ? s.GetString() ?? "08:00" : "08:00";
            var endStr = item.TryGetProperty("endTime", out var e) ? e.GetString() ?? "09:30" : "09:30";

            Enum.TryParse<DayOfWeek>(dayStr, true, out var day);
            TimeOnly.TryParse(startStr, out var start);
            TimeOnly.TryParse(endStr, out var end);

            return new ScheduleEventDto(title, room, lecturer, day, start, end, eventType);
        }
        catch
        {
            return null;
        }
    }

    private static string BuildIcal(ScheduleQueryResult schedule)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//StudienPlaner//FH Dortmund//DE");
        sb.AppendLine($"X-WR-CALNAME:Stundenplan {schedule.CourseKey} Sem{schedule.Semester}");

        var weekStart = GetNextMonday();

        foreach (var evt in schedule.Events)
        {
            var daysOffset = GetDayOffsetFromMonday(evt.DayOfWeek);
            var date = weekStart.AddDays(daysOffset).ToDateTime(TimeOnly.MinValue);
            var dtStart = date.Add(evt.StartTime.ToTimeSpan());
            var dtEnd = date.Add(evt.EndTime.ToTimeSpan());

            sb.AppendLine("BEGIN:VEVENT");
            sb.AppendLine($"UID:{Guid.NewGuid()}@studienplaner");
            sb.AppendLine($"SUMMARY:{EscapeIcal(evt.Title)}");
            sb.AppendLine($"DTSTART:{dtStart:yyyyMMddTHHmmss}");
            sb.AppendLine($"DTEND:{dtEnd:yyyyMMddTHHmmss}");
            if (evt.Room is not null) sb.AppendLine($"LOCATION:{EscapeIcal(evt.Room)}");
            if (evt.Lecturer is not null) sb.AppendLine($"DESCRIPTION:Dozent: {EscapeIcal(evt.Lecturer)}");
            sb.AppendLine("RRULE:FREQ=WEEKLY");
            sb.AppendLine("END:VEVENT");
        }

        sb.AppendLine("END:VCALENDAR");
        return sb.ToString();
    }

    private static DateOnly GetNextMonday()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var diff = ((int)DayOfWeek.Monday - (int)today.DayOfWeek + 7) % 7;
        return today.AddDays(diff == 0 ? 0 : diff);
    }

    private static string EscapeIcal(string value) =>
        value.Replace("\\", "\\\\").Replace(",", "\\,").Replace(";", "\\;").Replace("\n", "\\n");

    /// <summary>
    /// Returns the number of days from Monday (0) to the given day.
    /// Sunday (DayOfWeek=0) maps to offset 6 (end of the ISO week).
    /// </summary>
    private static int GetDayOffsetFromMonday(DayOfWeek day) =>
        day == DayOfWeek.Sunday ? 6 : (int)day - 1;

    private static List<CourseOfStudyDto> GetFallbackCourses() =>
    [
        new("INF", "Informatik (B.Sc.)", "Informatik"),
        new("WIF", "Wirtschaftsinformatik (B.Sc.)", "Informatik"),
        new("MCM", "Mobile Computing & Medien (B.Sc.)", "Informatik"),
        new("MBD", "Maschinenbau (B.Eng.)", "Maschinenbau"),
        new("ELC", "Elektrotechnik (B.Eng.)", "Elektrotechnik"),
        new("BIT", "Business Information Technology (B.Sc.)", "Informatik"),
    ];
}
