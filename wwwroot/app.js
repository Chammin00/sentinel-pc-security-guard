document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const btnScanSystem = document.getElementById('btn-scan-system');
    const healthScore = document.getElementById('health-score');
    const healthRing = document.getElementById('health-ring');
    const overallStatus = document.getElementById('overall-status');
    
    // Remediation
    const remediationSection = document.getElementById('remediation-section');
    const remediationActionsContainer = document.getElementById('remediation-actions-container');
    const remediationScript = document.getElementById('remediation-script');
    const btnCopyScript = document.getElementById('btn-copy-script');
    
    // Defender Card
    const indDefender = document.getElementById('ind-defender');
    const valDefenderRt = document.getElementById('val-defender-rt');
    const valDefenderAv = document.getElementById('val-defender-av');
    const valDefenderService = document.getElementById('val-defender-service');
    const valDefenderTamper = document.getElementById('val-defender-tamper');
    const valDefenderSignature = document.getElementById('val-defender-signature');
    
    // Firewall Card
    const indFirewall = document.getElementById('ind-firewall');
    const valFirewallDomain = document.getElementById('val-firewall-domain');
    const valFirewallPrivate = document.getElementById('val-firewall-private');
    const valFirewallPublic = document.getElementById('val-firewall-public');
    
    // Update/Policies Card
    const indUpdates = document.getElementById('ind-updates');
    const valUpdateStatus = document.getElementById('val-update-status');
    const valUpdateStartup = document.getElementById('val-update-startup');
    const valUacLua = document.getElementById('val-uac-lua');
    const valUacDesktop = document.getElementById('val-uac-desktop');
    
    // Scan File Tool
    const btnScanFile = document.getElementById('btn-scan-file');
    const scanFilePath = document.getElementById('scan-file-path');
    const scanResultContainer = document.getElementById('scan-result-container');
    const scanBadge = document.getElementById('scan-badge');
    const scanPathLabel = document.getElementById('scan-path-label');
    const scanOutput = document.getElementById('scan-output');
    
    // Password Tool
    const passInput = document.getElementById('pass-input');
    const passStrengthBar = document.getElementById('pass-strength-bar');
    const passStrengthLabel = document.getElementById('pass-strength-label');
    const passTips = document.getElementById('pass-tips');
    
    // Tables
    const portsTableBody = document.getElementById('ports-table-body');
    const badgePorts = document.getElementById('badge-ports');
    const startupTableBody = document.getElementById('startup-table-body');
    const badgeStartup = document.getElementById('badge-startup');

    // Initial Status Check
    fetchStatus();

    // Event Listeners
    btnScanSystem.addEventListener('click', fetchStatus);
    
    btnCopyScript.addEventListener('click', () => {
        navigator.clipboard.writeText(remediationScript.innerText)
            .then(() => {
                const originalText = btnCopyScript.innerText;
                btnCopyScript.innerText = '✅ Copied!';
                setTimeout(() => btnCopyScript.innerText = originalText, 2000);
            })
            .catch(err => console.error('Failed to copy text: ', err));
    });

    btnScanFile.addEventListener('click', runFileScan);

    passInput.addEventListener('input', checkPasswordStrength);

    // Fetch Security Status
    async function fetchStatus() {
        btnScanSystem.disabled = true;
        btnScanSystem.innerHTML = '<span class="icon">🔄</span> Scanning...';
        
        try {
            const response = await fetch('/api/status');
            if (!response.ok) throw new Error('API returned error');
            const data = await response.json();
            
            updateUI(data);
        } catch (error) {
            console.error('Error fetching system status:', error);
            overallStatus.innerText = 'ERROR';
            overallStatus.className = 'status-badge indicator danger';
        } finally {
            btnScanSystem.disabled = false;
            btnScanSystem.innerHTML = '<span class="icon">🔄</span> Scan System';
        }
    }

    // Update Dashboard UI
    function updateUI(data) {
        let score = 0;
        let issues = [];
        let scriptCmds = [];

        // 1. Windows Defender Audit
        const defender = data.Defender || {};
        const isRtOn = defender.RealTimeProtectionEnabled === true;
        const isAvOn = defender.AntivirusEnabled === true;
        const isServiceOn = defender.AMServiceEnabled === true;
        const isTamperOn = defender.IsTamperProtected === true;

        valDefenderRt.innerText = isRtOn ? 'Active' : 'Disabled';
        valDefenderRt.className = isRtOn ? 'status-val font-semibold text-emerald-400' : 'status-val font-semibold text-rose-500';
        if (!isRtOn) {
            valDefenderRt.style.color = '#ef4444';
        } else {
            valDefenderRt.style.color = '#10b981';
        }
        
        valDefenderAv.innerText = isAvOn ? 'Active' : 'Disabled';
        valDefenderAv.style.color = isAvOn ? '#10b981' : '#ef4444';

        valDefenderService.innerText = isServiceOn ? 'Running' : 'Stopped';
        valDefenderService.style.color = isServiceOn ? '#10b981' : '#ef4444';

        valDefenderTamper.innerText = isTamperOn ? 'Enabled' : 'Disabled';
        valDefenderTamper.style.color = isTamperOn ? '#10b981' : '#f5a623';

        // Parse WMI Date "/Date(1784874406000)/" or raw date
        let sigDate = defender.AntivirusSignatureLastUpdated;
        if (sigDate && sigDate.includes('Date')) {
            const timestamp = parseInt(sigDate.match(/\d+/)[0]);
            sigDate = new Date(timestamp).toLocaleString();
        }
        valDefenderSignature.innerText = sigDate || 'Unknown';

        // Calculate score for Defender
        if (isRtOn) score += 25; else {
            issues.push({
                title: 'Defender Real-Time Protection is Disabled',
                desc: 'Your PC is vulnerable to real-time malware execution and spyware infections.',
                actionId: 'enable-defender-rt',
                actionLabel: 'Try to Enable'
            });
            scriptCmds.push('Write-Host "Enabling Windows Defender Real-time Protection..." -ForegroundColor Cyan');
            scriptCmds.push('Set-MpPreference -DisableRealtimeMonitoring $false');
        }
        if (isAvOn) score += 15;
        if (isServiceOn) score += 10;

        // Defender status indicator
        if (isRtOn && isAvOn && isServiceOn) {
            indDefender.className = 'indicator safe';
        } else if (!isRtOn || !isServiceOn) {
            indDefender.className = 'indicator danger';
        } else {
            indDefender.className = 'indicator warning';
        }

        // 2. Firewall Audit
        const firewallList = data.Firewall || [];
        let firewallSafe = true;
        let domainOn = false, privateOn = false, publicOn = false;

        firewallList.forEach(profile => {
            const enabled = profile.Enabled === 1 || profile.Enabled === true;
            if (profile.Name === 'Domain') {
                domainOn = enabled;
                valFirewallDomain.innerText = enabled ? 'Enabled' : 'Disabled';
                valFirewallDomain.style.color = enabled ? '#10b981' : '#ef4444';
            } else if (profile.Name === 'Private') {
                privateOn = enabled;
                valFirewallPrivate.innerText = enabled ? 'Enabled' : 'Disabled';
                valFirewallPrivate.style.color = enabled ? '#10b981' : '#ef4444';
            } else if (profile.Name === 'Public') {
                publicOn = enabled;
                valFirewallPublic.innerText = enabled ? 'Enabled' : 'Disabled';
                valFirewallPublic.style.color = enabled ? '#10b981' : '#ef4444';
            }
            if (enabled) score += 10; else firewallSafe = false;
        });

        if (firewallList.length === 0) {
            indFirewall.className = 'indicator warning';
        } else if (firewallSafe) {
            indFirewall.className = 'indicator safe';
        } else {
            indFirewall.className = 'indicator danger';
            issues.push({
                title: 'Windows Firewall Profile is Disabled',
                desc: 'One or more networks profiles do not have firewall protection active.',
                actionId: 'enable-firewalls',
                actionLabel: 'Try to Enable All'
            });
            scriptCmds.push('Write-Host "Enabling all Windows Firewall profiles..." -ForegroundColor Cyan');
            scriptCmds.push('Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True');
        }

        // 3. Updates & Policies Audit
        const updates = data.Updates || {};
        // Service status: 1 = Stopped, 4 = Running
        const updateServiceRunning = updates.Status === 4 || updates.Status === "Running";
        const updateStartup = updates.StartType; // 2 = Auto, 3 = Manual, 4 = Disabled
        const uac = data.UAC || {};
        const isLuaOn = uac.EnableLUA === 1 || uac.EnableLUA === true;
        const isSecureDesktop = uac.PromptOnSecureDesktop === 1 || uac.PromptOnSecureDesktop === true;

        let statusText = 'Unknown';
        if (updates.Status === 1) statusText = 'Stopped';
        else if (updates.Status === 4) statusText = 'Running';
        else if (updates.Status) statusText = updates.Status.toString();
        
        let startupText = 'Unknown';
        if (updateStartup === 2) startupText = 'Automatic';
        else if (updateStartup === 3) startupText = 'Manual';
        else if (updateStartup === 4) startupText = 'Disabled';
        else if (updateStartup) startupText = updateStartup.toString();

        valUpdateStatus.innerText = statusText;
        valUpdateStatus.style.color = updateServiceRunning ? '#10b981' : '#f5a623';
        valUpdateStartup.innerText = startupText;

        valUacLua.innerText = isLuaOn ? 'Enabled' : 'Disabled';
        valUacLua.style.color = isLuaOn ? '#10b981' : '#ef4444';
        valUacDesktop.innerText = isSecureDesktop ? 'Active' : 'Disabled';
        valUacDesktop.style.color = isSecureDesktop ? '#10b981' : '#ef4444';

        if (isLuaOn) score += 10;
        if (updateStartup !== 4) score += 10;

        if (updateStartup === 4 || !updateServiceRunning) {
            issues.push({
                title: 'Windows Update Service is Stopped/Disabled',
                desc: 'Your system may miss critical security patches and definition updates.',
                actionId: 'start-wuauserv',
                actionLabel: 'Start Update Service'
            });
            scriptCmds.push('Write-Host "Enabling and starting Windows Update Service (wuauserv)..." -ForegroundColor Cyan');
            scriptCmds.push('Set-Service -Name wuauserv -StartupType Manual');
            scriptCmds.push('Start-Service -Name wuauserv');
        }

        if (isLuaOn && updateServiceRunning) {
            indUpdates.className = 'indicator safe';
        } else if (!isLuaOn) {
            indUpdates.className = 'indicator danger';
        } else {
            indUpdates.className = 'indicator warning';
        }

        // Update Overall Score Ring
        healthScore.innerText = `${score}%`;
        
        // Update circle stroke-dashoffset
        const r = 34;
        const circumference = 2 * Math.PI * r; // 213.6
        const offset = circumference - (score / 100) * circumference;
        healthRing.style.strokeDashoffset = offset;
        
        if (score >= 90) {
            healthRing.style.stroke = '#10b981'; // Green
            overallStatus.innerText = 'Protected';
            overallStatus.className = 'status-badge';
            overallStatus.style.color = '#10b981';
            overallStatus.style.background = 'rgba(16, 185, 129, 0.1)';
        } else if (score >= 60) {
            healthRing.style.stroke = '#f5a623'; // Amber
            overallStatus.innerText = 'At Risk';
            overallStatus.className = 'status-badge';
            overallStatus.style.color = '#f5a623';
            overallStatus.style.background = 'rgba(245, 166, 35, 0.1)';
        } else {
            healthRing.style.stroke = '#ef4444'; // Red
            overallStatus.innerText = 'Exposed';
            overallStatus.className = 'status-badge';
            overallStatus.style.color = '#ef4444';
            overallStatus.style.background = 'rgba(239, 68, 68, 0.1)';
        }

        // Render Remediation Section
        if (issues.length > 0) {
            remediationSection.classList.remove('hidden');
            remediationActionsContainer.innerHTML = '';
            
            issues.forEach(issue => {
                const item = document.createElement('div');
                item.className = 'remediation-item';
                item.innerHTML = `
                    <div class="remediation-details">
                        <h4>${issue.title}</h4>
                        <p>${issue.desc}</p>
                    </div>
                    <button class="btn btn-sm btn-primary btn-action-remediate" data-action="${issue.actionId}">
                        ${issue.actionLabel}
                    </button>
                `;
                remediationActionsContainer.appendChild(item);
            });

            // Bind triggers for dynamic remediation buttons
            document.querySelectorAll('.btn-action-remediate').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const action = e.target.getAttribute('data-action');
                    e.target.disabled = true;
                    e.target.innerText = 'Fixing...';
                    
                    try {
                        const res = await fetch('/api/remediate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: action })
                        });
                        const resData = await res.json();
                        
                        if (resData.success) {
                            e.target.innerText = 'Fixed';
                            e.target.className = 'btn btn-sm btn-outline';
                            setTimeout(fetchStatus, 1500);
                        } else {
                            e.target.innerText = 'Elevation Required';
                            e.target.style.background = '#ef4444';
                            e.target.style.color = '#fff';
                            alert('This configuration requires Administrator privileges. Please run the PowerShell script below in an elevated terminal.');
                        }
                    } catch (err) {
                        console.error('Remediation error:', err);
                        e.target.innerText = 'Failed';
                        e.target.disabled = false;
                    }
                });
            });

            // Set PowerShell script
            scriptCmds.push('Write-Host "Remediation complete! Refresh the dashboard." -ForegroundColor Green');
            remediationScript.innerText = scriptCmds.join('\n');
        } else {
            remediationSection.classList.add('hidden');
        }

        // 4. Ports table populate
        const ports = data.Ports || [];
        if (Array.isArray(ports)) {
            badgePorts.innerText = `${ports.length} Connections`;
            portsTableBody.innerHTML = '';
            
            // Sort by port number
            ports.sort((a, b) => a.LocalPort - b.LocalPort);
            
            ports.forEach(p => {
                const port = p.LocalPort;
                let riskClass = 'low';
                let riskText = 'Normal';
                
                // Assess risk of common ports
                if (port === 135 || port === 445) {
                    riskClass = 'high';
                    riskText = 'High Risk (SMB/RPC)';
                } else if (port === 3389) {
                    riskClass = 'high';
                    riskText = 'High Risk (RDP)';
                } else if (port === 22 || port === 80 || port === 443) {
                    riskClass = 'low';
                    riskText = 'Standard Service';
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.LocalAddress}</td>
                    <td><strong>${port}</strong></td>
                    <td>${p.ProcessId}</td>
                    <td><code>${p.ProcessName}</code></td>
                    <td><span class="risk-pill ${riskClass}">${riskText}</span></td>
                `;
                portsTableBody.appendChild(tr);
            });
        } else {
            badgePorts.innerText = 'Error';
            portsTableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: #ef4444">Error listing ports: ${ports.Error || 'Unknown Error'}</td></tr>`;
        }

        // 5. Startup items table populate
        const startup = data.Startup || [];
        if (Array.isArray(startup)) {
            badgeStartup.innerText = `${startup.length} Programs`;
            startupTableBody.innerHTML = '';
            
            startup.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${item.Name || 'Unknown'}</strong></td>
                    <td class="text-xs"><code>${item.Command || 'N/A'}</code></td>
                    <td class="text-xs">${item.Location || 'N/A'}</td>
                    <td>${item.User || 'System'}</td>
                `;
                startupTableBody.appendChild(tr);
            });
        } else {
            badgeStartup.innerText = 'Error';
            startupTableBody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: #ef4444">Error loading startup items: ${startup.Error || 'Unknown Error'}</td></tr>`;
        }
    }

    // Run File Scan via MpCmdRun.exe
    async function runFileScan() {
        const path = scanFilePath.value.trim();
        if (!path) {
            alert('Please enter a file or folder path to scan.');
            return;
        }

        btnScanFile.disabled = true;
        btnScanFile.innerText = 'Scanning...';
        scanResultContainer.classList.remove('hidden');
        scanPathLabel.innerText = path;
        scanBadge.innerText = 'Scanning';
        scanBadge.className = 'scan-badge';
        scanOutput.innerText = 'Initializing Windows Defender Command Line Scanner (MpCmdRun.exe)...\nThis may take up to a minute depending on file size...';

        try {
            const res = await fetch('/api/scan-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: path })
            });

            if (res.status === 404) {
                scanBadge.innerText = 'Not Found';
                scanBadge.className = 'scan-badge error';
                scanOutput.innerText = `Error: The path "${path}" does not exist on this PC. Check spelling and try again.`;
                return;
            }

            if (!res.ok) throw new Error('Scan failed');
            const data = await res.json();

            if (data.isClean) {
                scanBadge.innerText = 'Clean';
                scanBadge.className = 'scan-badge clean';
            } else if (data.isThreatDetected) {
                scanBadge.innerText = 'Threat Detected';
                scanBadge.className = 'scan-badge threat';
            } else {
                scanBadge.innerText = 'Completed';
                scanBadge.className = 'scan-badge error';
            }

            scanOutput.innerText = data.output || 'Scan finished with no details.\nExit Code: ' + data.exitCode;
            if (data.error) {
                scanOutput.innerText += '\n\nErrors encountered:\n' + data.error;
            }
        } catch (error) {
            console.error('File scan error:', error);
            scanBadge.innerText = 'Scan Failed';
            scanBadge.className = 'scan-badge error';
            scanOutput.innerText = 'Failed to execute MpCmdRun.exe scanner.\nEnsure the backend service is running with correct access.';
        } finally {
            btnScanFile.disabled = false;
            btnScanFile.innerText = 'Scan Path';
        }
    }

    // Password Strength Auditor
    function checkPasswordStrength() {
        const password = passInput.value;
        passTips.innerHTML = '';
        
        if (password.length === 0) {
            passStrengthBar.style.width = '0%';
            passStrengthBar.style.backgroundColor = 'transparent';
            passStrengthLabel.innerText = 'Strength: Empty';
            return;
        }

        let score = 0;
        let tips = [];

        // Length checks
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;
        else tips.push('Length under 16 characters (longer is always stronger).');

        // Character variety
        if (/[A-Z]/.test(password)) score += 1;
        else tips.push('Add uppercase letters (A-Z).');

        if (/[a-z]/.test(password)) score += 1;
        else tips.push('Add lowercase letters (a-z).');

        if (/[0-9]/.test(password)) score += 1;
        else tips.push('Add numeric digits (0-9).');

        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        else tips.push('Add special characters (e.g. @, #, $, %).');

        // Common patterns / entropy
        if (/(.)\1{2,}/.test(password)) {
            score = Math.max(0, score - 1);
            tips.push('Avoid repeating letters or numbers consecutively (e.g., "aaa", "111").');
        }

        let strengthText = 'Very Weak';
        let barColor = '#ef4444';
        let pct = '15%';

        if (score >= 6) {
            strengthText = 'Strong (Excellent)';
            barColor = '#10b981';
            pct = '100%';
        } else if (score >= 4) {
            strengthText = 'Moderate (Good)';
            barColor = '#f5a623';
            pct = '65%';
        } else if (score >= 2) {
            strengthText = 'Weak';
            barColor = '#ef4444';
            pct = '35%';
        }

        passStrengthBar.style.width = pct;
        passStrengthBar.style.backgroundColor = barColor;
        passStrengthLabel.innerText = `Strength: ${strengthText}`;
        passStrengthLabel.style.color = barColor;

        if (tips.length > 0) {
            tips.forEach(tip => {
                const li = document.createElement('li');
                li.innerText = tip;
                passTips.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.innerText = '🎉 Outstanding password! Highly resilient to brute force.';
            li.style.color = '#10b981';
            passTips.appendChild(li);
        }
    }
});
