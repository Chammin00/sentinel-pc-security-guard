using System.Diagnostics;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    headers["Content-Security-Policy"] =
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

    if (HttpMethods.IsPost(context.Request.Method) ||
        HttpMethods.IsPut(context.Request.Method) ||
        HttpMethods.IsPatch(context.Request.Method) ||
        HttpMethods.IsDelete(context.Request.Method))
    {
        var origin = context.Request.Headers.Origin.ToString();
        var referer = context.Request.Headers.Referer.ToString();
        var checkUri = !string.IsNullOrEmpty(origin) ? origin : referer;

        if (!string.IsNullOrEmpty(checkUri))
        {
            if (!Uri.TryCreate(checkUri, UriKind.Absolute, out var uri) ||
                !string.Equals(uri.Host, context.Request.Host.Host, StringComparison.OrdinalIgnoreCase) ||
                (context.Request.Host.Port.HasValue && uri.Port != context.Request.Host.Port.Value))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { error = "Cross-origin state-changing request blocked." });
                return;
            }
        }
    }

    await next();
});

app.UseDefaultFiles();
app.UseStaticFiles();

// Helper to run PowerShell scripts
string RunPowerShellScript(string scriptPath, string arguments = "")
{
    using var process = new Process();
    process.StartInfo.FileName = "powershell.exe";
    process.StartInfo.Arguments = $"-NoProfile -ExecutionPolicy Bypass -File \"{scriptPath}\" {arguments}";
    process.StartInfo.RedirectStandardOutput = true;
    process.StartInfo.RedirectStandardError = true;
    process.StartInfo.UseShellExecute = false;
    process.StartInfo.CreateNoWindow = true;
    process.Start();
    string output = process.StandardOutput.ReadToEnd();
    string error = process.StandardError.ReadToEnd();
    process.WaitForExit();
    return string.IsNullOrEmpty(output) ? error : output;
}

app.MapGet("/api/status", () =>
{
    string scriptPath = Path.Combine(app.Environment.ContentRootPath, "Get-SecurityStatus.ps1");
    if (!File.Exists(scriptPath))
    {
        return Results.Problem("Security status script not found.");
    }

    try
    {
        string jsonResult = RunPowerShellScript(scriptPath);
        return Results.Content(jsonResult, "application/json");
    }
    catch (Exception)
    {
        return Results.Problem("Failed to retrieve security status.");
    }
});

// File scanning endpoint using Windows Defender MpCmdRun
app.MapPost("/api/scan-file", async (HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var body = await reader.ReadToEndAsync();
    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    var request = JsonSerializer.Deserialize<ScanRequest>(body, options);

    if (request == null || string.IsNullOrWhiteSpace(request.FilePath))
    {
        return Results.BadRequest(new { error = "Invalid file path" });
    }

    if (!File.Exists(request.FilePath) && !Directory.Exists(request.FilePath))
    {
        return Results.NotFound(new { error = "File or directory not found" });
    }

    string mpCmdRunPath = @"C:\Program Files\Windows Defender\MpCmdRun.exe";

    try
    {
        using var process = new Process();
        process.StartInfo.FileName = mpCmdRunPath;
        process.StartInfo.ArgumentList.Add("-Scan");
        process.StartInfo.ArgumentList.Add("-ScanType");
        process.StartInfo.ArgumentList.Add("3");
        process.StartInfo.ArgumentList.Add("-File");
        process.StartInfo.ArgumentList.Add(request.FilePath);
        process.StartInfo.RedirectStandardOutput = true;
        process.StartInfo.RedirectStandardError = true;
        process.StartInfo.UseShellExecute = false;
        process.StartInfo.CreateNoWindow = true;
        process.Start();

        string output = await process.StandardOutput.ReadToEndAsync();
        string error = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        int exitCode = process.ExitCode;
        // MpCmdRun.exe exit codes:
        // 0 = clean, 2 = threat found, 1 = error/cancelled
        bool isClean = exitCode == 0;
        bool isThreatDetected = exitCode == 2;

        return Results.Ok(new
        {
            exitCode,
            isClean,
            isThreatDetected,
            output = output.Trim(),
            error = error.Trim()
        });
    }
    catch (Exception)
    {
        return Results.Problem("File scan failed due to an internal error.");
    }
});

// Remediation endpoint to try running PowerShell commands
app.MapPost("/api/remediate", async (HttpContext context) =>
{
    using var reader = new StreamReader(context.Request.Body);
    var body = await reader.ReadToEndAsync();
    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    var request = JsonSerializer.Deserialize<RemediateRequest>(body, options);

    if (request == null || string.IsNullOrWhiteSpace(request.Action))
    {
        return Results.BadRequest(new { error = "Invalid action" });
    }

    string command = "";
    if (request.Action == "enable-defender-rt")
    {
        command = "Set-MpPreference -DisableRealtimeMonitoring $false";
    }
    else if (request.Action == "start-wuauserv")
    {
        command = "Set-Service -Name wuauserv -StartupType Manual; Start-Service -Name wuauserv";
    }
    else
    {
        return Results.BadRequest(new { error = "Unknown remediation action." });
    }

    try
    {
        using var process = new Process();
        process.StartInfo.FileName = "powershell.exe";
        process.StartInfo.ArgumentList.Add("-NoProfile");
        process.StartInfo.ArgumentList.Add("-ExecutionPolicy");
        process.StartInfo.ArgumentList.Add("Bypass");
        process.StartInfo.ArgumentList.Add("-Command");
        process.StartInfo.ArgumentList.Add(command);
        process.StartInfo.RedirectStandardOutput = true;
        process.StartInfo.RedirectStandardError = true;
        process.StartInfo.UseShellExecute = false;
        process.StartInfo.CreateNoWindow = true;
        process.Start();

        string output = await process.StandardOutput.ReadToEndAsync();
        string error = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        bool success = process.ExitCode == 0;

        return Results.Ok(new
        {
            success,
            exitCode = process.ExitCode,
            output = output.Trim(),
            error = error.Trim()
        });
    }
    catch (Exception)
    {
        return Results.Problem("Remediation failed due to an internal error.");
    }
});

app.Run();

public class ScanRequest
{
    public string FilePath { get; set; } = "";
}

public class RemediateRequest
{
    public string Action { get; set; } = "";
}
