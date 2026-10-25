$defender = try { 
    Get-MpComputerStatus | Select-Object AntivirusEnabled, RealTimeProtectionEnabled, AMServiceEnabled, AntivirusSignatureLastUpdated, IsTamperProtected 
} catch { 
    @{ Error = $_.Exception.Message } 
}

$firewall = try { 
    Get-NetFirewallProfile | Select-Object Name, Enabled 
} catch { 
    @{ Error = $_.Exception.Message } 
}

$uac = try { 
    Get-ItemProperty -Path HKLM:\Software\Microsoft\Windows\CurrentVersion\Policies\System | Select-Object ConsentPromptBehaviorAdmin, PromptOnSecureDesktop, EnableLUA 
} catch { 
    @{ Error = $_.Exception.Message } 
}

$updates = try { 
    Get-Service -Name wuauserv | Select-Object Status, StartType 
} catch { 
    @{ Error = $_.Exception.Message } 
}

$ports = try { 
    # Get active listening TCP connections, and resolve their process names
    $connections = Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess
    $connections | ForEach-Object {
        $ownerPid = $_.OwningProcess
        $pname = try { (Get-Process -Id $ownerPid).ProcessName } catch { "Unknown" }
        [PSCustomObject]@{
            LocalAddress = $_.LocalAddress
            LocalPort = $_.LocalPort
            ProcessId = $ownerPid
            ProcessName = $pname
        }
    }
} catch { 
    @{ Error = $_.Exception.Message } 
}

$startup = try { 
    Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location, User 
} catch { 
    @{ Error = $_.Exception.Message } 
}

$result = @{
    Defender = $defender
    Firewall = $firewall
    UAC = $uac
    Updates = $updates
    Ports = $ports
    Startup = $startup
}

$result | ConvertTo-Json -Depth 5
