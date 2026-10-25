using System.Diagnostics;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Enable static files
builder.Services.AddDirectoryBrowser();

var app = builder.Build();

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
        return Results.Problem($"Script Get-SecurityStatus.ps1 not found in content root: {app.Environment.ContentRootPath}");
    }

    try
    {
        string jsonResult = RunPowerShellScript(scriptPath);
        return Results.Content(jsonResult, "application/json");
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
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
        process.StartInfo.Arguments = $"-Scan -ScanType 3 -File \"{request.FilePath}\"";
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
        
        return Results.Ok(new {
            exitCode,
            isClean,
            isThreatDetected,
            output = output.Trim(),
            error = error.Trim()
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
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
        return Results.BadRequest(new { error = $"Unknown action: {request.Action}" });
    }

    try
    {
        using var process = new Process();
        process.StartInfo.FileName = "powershell.exe";
        process.StartInfo.Arguments = $"-NoProfile -ExecutionPolicy Bypass -Command \"{command}\"";
        process.StartInfo.RedirectStandardOutput = true;
        process.StartInfo.RedirectStandardError = true;
        process.StartInfo.UseShellExecute = false;
        process.StartInfo.CreateNoWindow = true;
        process.Start();

        string output = await process.StandardOutput.ReadToEndAsync();
        string error = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        bool success = process.ExitCode == 0;

        return Results.Ok(new {
            success,
            exitCode = process.ExitCode,
            output = output.Trim(),
            error = error.Trim()
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
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

