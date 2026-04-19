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

        // Each academic year has two semesters: winter (Oct–Feb) and summer (Mar–Sep).
        // Count full semesters elapsed since enrollment start (assumed winter semester of enrollYear).
        int? estimatedSemester = null;
        var digits = new string(matrikelNumber.Where(char.IsDigit).ToArray());
        if (digits.Length >= 2 && int.TryParse(digits[..2], out var yearSuffix))
        {
            var enrollYear = yearSuffix < 50 ? 2000 + yearSuffix : 1900 + yearSuffix;
            var now = DateTime.UtcNow;

            // Treat summer semester as months 3–9, winter semester as months 10–2.
            // Count completed semesters: 2 per full year, +1 if currently in or past summer.
            var yearsElapsed = now.Year - enrollYear;
            var inOrPastSummer = now.Month is >= 3 and <= 9;
            var semestersElapsed = yearsElapsed * 2 + (inOrPastSummer ? 1 : 0);
            estimatedSemester = Math.Clamp(semestersElapsed, 1, 12);
        }

        return (resolvedKey, estimatedSemester);
    }
}
