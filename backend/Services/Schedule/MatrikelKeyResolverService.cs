namespace StudienPlaner.Services.Schedule;

/// <summary>Resolves a Matrikel number to a course key and estimated semester.</summary>
public class MatrikelKeyResolverService
{
    // Maps common FH Dortmund Matrikel prefixes to course keys
    private static readonly Dictionary<string, string> PrefixToCourseKey = new(StringComparer.OrdinalIgnoreCase)
    {
        ["INF"] = "INF",
        ["WIF"] = "WIF",
        ["MCM"] = "MCM",
        ["MBD"] = "MBD",
        ["ELC"] = "ELC",
        ["BIT"] = "BIT",
        ["WIA"] = "WIA",
        ["VIA"] = "VIA",
        ["MED"] = "MED",
        ["DES"] = "DES",
        ["BAU"] = "BAU",
        ["MAS"] = "MAS",
        ["ELM"] = "ELM",
        ["LOG"] = "LOG",
        ["SWB"] = "SWB",
        ["KDM"] = "KDM",
        ["BWL"] = "BWL",
    };

    /// <summary>
    /// Resolves a Matrikel number to a course key and estimated current semester.
    /// The enrollment year is extracted from digits at positions 3–4 of the Matrikel number.
    /// </summary>
    public (string? CourseKey, int? EstimatedSemester) ResolveMatrikel(string matrikelNumber)
    {
        if (string.IsNullOrWhiteSpace(matrikelNumber))
            return (null, null);

        // Try to match known prefixes (letters at start)
        string? resolvedKey = null;
        foreach (var prefix in PrefixToCourseKey.Keys)
        {
            if (matrikelNumber.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                resolvedKey = PrefixToCourseKey[prefix];
                break;
            }
        }

        // Extract enrollment year from digits 3-4 (0-indexed positions 2-3 after letters)
        int? estimatedSemester = null;
        var digits = new string(matrikelNumber.Where(char.IsDigit).ToArray());
        if (digits.Length >= 2 && int.TryParse(digits[..2], out var yearSuffix))
        {
            var enrollYear = yearSuffix < 50 ? 2000 + yearSuffix : 1900 + yearSuffix;
            var now = DateTime.UtcNow;
            var semestersElapsed = (now.Year - enrollYear) * 2
                + (now.Month >= 3 && now.Month <= 8 ? 1 : 0);
            estimatedSemester = Math.Clamp(semestersElapsed, 1, 12);
        }

        return (resolvedKey, estimatedSemester);
    }
}
