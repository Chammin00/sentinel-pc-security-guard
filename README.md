# 🛡️ Sentinel PC Security Guard

A lightweight local endpoint security auditing hub and live dashboard that collects real-time PowerShell telemetry on firewall posture, antivirus status, unquoted service paths, and critical Windows event logs.

## 🚀 Overview

Built with ASP.NET Core and PowerShell 7, Sentinel provides continuous host hygiene assessment for workstations and servers without requiring heavy enterprise agents.

## 🛠️ Tech Stack
* **.NET 10.0 / C#**
* **PowerShell 7** (`Get-SecurityStatus.ps1`)
* **Windows Event Logs & Sysmon Telemetry**
* **HTML5 / CSS3 / WebSockets**

## 🏃 Running Locally
```powershell
dotnet run
```
Then navigate to `http://localhost:5000` to view the live endpoint security scorecard.
