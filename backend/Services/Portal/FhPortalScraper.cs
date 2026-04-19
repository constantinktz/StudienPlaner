using AngleSharp;
using StudienPlaner.Models.Responses;

namespace StudienPlaner.Services.Portal;

/// <summary>Scrapes module data from the FH Dortmund QIS portal using AngleSharp.</summary>
public class FhPortalScraper(ILogger<FhPortalScraper> logger)
{
    private const string QisBase = "https://qis.fh-dortmund.de/qisserver";
    private const string LoginPage = $"{QisBase}/pages/cs/sys/portal/hisinoneStartPage.faces";
    private const string StudyPlanUrl = $"{QisBase}/pages/cm/exa/enrollment/info/start.xhtml"
        + "?_flowId=studyPlanner-flow&_flowExecutionKey=e5s1";

    /// <summary>Logs in to the QIS portal and scrapes module data.</summary>
    public async Task<List<ModuleDto>> ScrapeModulesAsync(
        string fhUsername, string fhPassword, CancellationToken ct = default)
    {
        var handler = new HttpClientHandler
        {
            AllowAutoRedirect = true,
            UseCookies = true,
            CookieContainer = new System.Net.CookieContainer()
        };

        using var client = new HttpClient(handler);
        client.DefaultRequestHeaders.Add("User-Agent",
            "Mozilla/5.0 (compatible; StudienPlaner/1.0)");

        try
        {
            // Step 1: GET login page to obtain session cookies and hidden fields
            var loginPageHtml = await client.GetStringAsync(LoginPage, ct);
            var (_, hiddenFields) = await ParseLoginPageAsync(loginPageHtml);

            // Step 2: POST credentials
            var formData = new Dictionary<string, string>(hiddenFields)
            {
                ["asdf"] = fhUsername,
                ["fdsa"] = fhPassword,
                ["submit"] = "Anmelden"
            };

            var postResponse = await client.PostAsync(LoginPage,
                new FormUrlEncodedContent(formData), ct);
            postResponse.EnsureSuccessStatusCode();

            // Step 3: GET study plan page
            var studyPlanHtml = await client.GetStringAsync(StudyPlanUrl, ct);

            return await ParseModulesFromHtmlAsync(studyPlanHtml);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to scrape modules from FH portal");
            return [];
        }
    }

    private static async Task<(string? jsessionId, Dictionary<string, string> hiddenFields)>
        ParseLoginPageAsync(string html)
    {
        var context = BrowsingContext.New(AngleSharp.Configuration.Default);
        var document = await context.OpenAsync(req => req.Content(html));

        var hiddenFields = new Dictionary<string, string>();
        foreach (var input in document.QuerySelectorAll("input[type='hidden']"))
        {
            var name = input.GetAttribute("name");
            var value = input.GetAttribute("value") ?? "";
            if (!string.IsNullOrEmpty(name))
                hiddenFields[name] = value;
        }

        return (null, hiddenFields);
    }

    private static async Task<List<ModuleDto>> ParseModulesFromHtmlAsync(string html)
    {
        var context = BrowsingContext.New(AngleSharp.Configuration.Default);
        var document = await context.OpenAsync(req => req.Content(html));

        var modules = new List<ModuleDto>();

        // Parse table rows containing module data
        var rows = document.QuerySelectorAll("table.examTable tbody tr, table[class*='module'] tbody tr");

        foreach (var row in rows)
        {
            var cells = row.QuerySelectorAll("td").ToList();
            if (cells.Count < 4) continue;

            var moduleKey = cells[0].TextContent.Trim();
            var moduleName = cells[1].TextContent.Trim();

            if (string.IsNullOrWhiteSpace(moduleKey) || string.IsNullOrWhiteSpace(moduleName))
                continue;

            int.TryParse(new string(cells.Count > 2
                ? cells[2].TextContent.Trim().Where(char.IsDigit).ToArray()
                : []), out var credits);

            var statusText = cells.Count > 3 ? cells[3].TextContent.Trim() : "";
            var status = ParseStatus(statusText);

            double? grade = null;
            if (cells.Count > 4 && double.TryParse(
                cells[4].TextContent.Trim().Replace(",", "."),
                System.Globalization.CultureInfo.InvariantCulture, out var g))
            {
                grade = g;
            }

            modules.Add(new ModuleDto(
                ModuleKey: moduleKey,
                ModuleName: moduleName,
                Credits: credits > 0 ? credits : 5,
                Status: status,
                Grade: grade,
                SemesterPlanned: null,
                SemesterTaken: null,
                AttemptCount: 1,
                IsMandatory: true,
                Prerequisites: [],
                SyncedAt: DateTime.UtcNow
            ));
        }

        return modules;
    }

    private static Database.Entities.ModuleStatus ParseStatus(string statusText) =>
        statusText.ToLowerInvariant() switch
        {
            var s when s.Contains("bestanden") || s.Contains("passed") => Database.Entities.ModuleStatus.Passed,
            var s when s.Contains("nicht bestanden") || s.Contains("failed") => Database.Entities.ModuleStatus.Failed,
            var s when s.Contains("angemeldet") || s.Contains("enrolled") => Database.Entities.ModuleStatus.Enrolled,
            var s when s.Contains("geplant") || s.Contains("planned") => Database.Entities.ModuleStatus.Planned,
            _ => Database.Entities.ModuleStatus.Open
        };
}
