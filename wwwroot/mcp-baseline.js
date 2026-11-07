/**
 * ⚡ Antigravity MCP Baseline System (mcp-baseline.js)
 *
 * Integrates Model Context Protocol (MCP) server telemetry, tool registries,
 * and quick-action HUD directly into the Antigravity Baseline standard.
 *
 * Works in harmony with:
 * - high-gloss-lacquer.css / high-gloss-lacquer.js
 * - cosmic-background.js
 */

(function () {
  'use strict';

  if (window.AntigravityMCP) return;

  const MCP_REGISTRY = {
    version: "1.0.0",
    servers: [
      {
        id: "game-capture",
        name: "Game Capture MCP",
        category: "Media & Streaming",
        color: "#EC4899",
        icon: "🎥",
        status: "Active",
        toolsCount: 14,
        description: "OBS Studio 31, NVIDIA ShadowPlay AV1 & Xbox Game Bar DVR orchestration with real-time frame telemetry.",
        targetProjects: ["Record my Gameplay", "game studio", "youtube shorts edit for gaming", "Game Library"]
      },
      {
        id: "game-studio",
        name: "Game Studio MCP",
        category: "Game Engines & ROMs",
        color: "#F97316",
        icon: "🎮",
        status: "Active",
        toolsCount: 18,
        description: "Unreal Engine 5.8 C++, Unity 6, Godot 4 automation, live PIE control, and binary ROM header/IPS modding.",
        targetProjects: ["game studio", "game mods", "REA", "reverse engineer applications", "mobile game", "Game Library"]
      },
      {
        id: "github",
        name: "GitHub Developer MCP",
        category: "CI/CD & Source",
        color: "#38BDF8",
        icon: "🐙",
        status: "Active",
        toolsCount: 8,
        description: "Full git tree manipulation, repository commits, branch workflows, and PR reviews via GitHub REST/GraphQL.",
        targetProjects: ["Github Portfolio", "deploy", "project refinement", "portfolio"]
      },
      {
        id: "puppeteer",
        name: "Puppeteer Web Browser MCP",
        category: "Headless Web Automation",
        color: "#10B981",
        icon: "🌐",
        status: "Active",
        toolsCount: 7,
        description: "Chromium automation for dynamic SPA rendering, DOM scraping, form entry, and visual layout evaluation.",
        targetProjects: ["deal Finder", "track most wanted", "Track Home Value", "spam block", "bot finder", "Game Library"]
      },
      {
        id: "google-drive",
        name: "Google Drive Filesystem MCP",
        category: "Filesystem & Workspace",
        color: "#EAB308",
        icon: "📁",
        status: "Active",
        toolsCount: 7,
        description: "Deep workspace filesystem bridge to G:\\My Drive with transactional read/write, tree indexing, and file ops.",
        targetProjects: ["google drive organizer", "email organizer", "deploy", "My Planetarium", "note taker"]
      },
      {
        id: "ollama",
        name: "Ollama Local AI MCP",
        category: "Local Intelligence Hub",
        color: "#8B5CF6",
        icon: "🦙",
        status: "Active",
        toolsCount: 4,
        description: "Sub-millisecond local LLM inference running Qwen 2.5 Coder, Llama 3, and specialized task Modelfiles.",
        targetProjects: ["ollama", "How to train your AI", "personal assistant", "using ai agents for profit"]
      },
      {
        id: "google-ai-studio",
        name: "Google AI Studio MCP",
        category: "Frontier Cloud Intelligence",
        color: "#6366F1",
        icon: "✨",
        status: "Active",
        toolsCount: 3,
        description: "Multi-modal Gemini 2.5 Flash & Pro reasoning models with ultra-deep 2M+ token contexts.",
        targetProjects: ["agent 365", "ai defense", "Choogle", "My Custom Gui", "project refinement"]
      }
    ]
  };

  const AntigravityMCP = {
    version: MCP_REGISTRY.version,
    getServers: function () {
      return MCP_REGISTRY.servers;
    },
    getServer: function (id) {
      return MCP_REGISTRY.servers.find(s => s.id === id);
    },
    getProjectsForServer: function (id) {
      const server = this.getServer(id);
      return server ? server.targetProjects : [];
    },
    getServerForProject: function (projectName) {
      return MCP_REGISTRY.servers.filter(s => s.targetProjects.includes(projectName));
    },
    toggleHUD: function () {
      let drawer = document.getElementById('antigravity-mcp-hud');
      if (!drawer) {
        this.renderHUD();
        drawer = document.getElementById('antigravity-mcp-hud');
      }
      drawer.classList.toggle('translate-x-full');
      drawer.classList.toggle('opacity-0');
      drawer.classList.toggle('pointer-events-none');
    },
    renderHUD: function () {
      if (document.getElementById('antigravity-mcp-hud')) return;

      const hud = document.createElement('div');
      hud.id = 'antigravity-mcp-hud';
      hud.className = 'fixed top-0 right-0 h-full w-96 max-w-[90vw] z-[9999] bg-[#050B18]/95 backdrop-blur-2xl border-l border-[#C5A059]/30 text-slate-100 shadow-2xl transition-all duration-300 ease-out translate-x-full opacity-0 pointer-events-none flex flex-col font-sans';

      hud.innerHTML = `
        <div class="p-4 border-b border-[#C5A059]/20 flex items-center justify-between bg-gradient-to-r from-[#0E1D3A] to-[#050B18]">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚡</span>
            <div>
              <div class="text-xs uppercase tracking-wider text-[#C5A059] font-bold">Baseline MCP Hub</div>
              <div class="text-sm font-semibold text-white">Configured Servers (7)</div>
            </div>
          </div>
          <button id="close-mcp-hud-btn" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            ✕
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          ${MCP_REGISTRY.servers.map(s => `
            <div class="p-3.5 rounded-xl border border-white/10 bg-[#0B162C]/80 hover:border-[#C5A059]/50 transition-all hover:shadow-[0_4px_20px_rgba(197,160,89,0.15)] group">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="text-base">${s.icon}</span>
                  <span class="font-bold text-sm text-white group-hover:text-[#DFBA73] transition-colors">${s.name}</span>
                </div>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ${s.status}
                </span>
              </div>
              <p class="text-xs text-slate-300 mb-2 leading-relaxed">${s.description}</p>
              <div class="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
                <span><strong class="text-white">${s.toolsCount}</strong> tools</span>
                <span class="text-[#C5A059] font-mono">${s.targetProjects.length} linked projects</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="p-4 border-t border-[#C5A059]/20 bg-[#020610] text-[11px] text-slate-400 flex items-center justify-between">
          <span>Global config: <code class="text-[#DFBA73]">~/.gemini/config/mcp_config.json</code></span>
        </div>
      `;

      document.body.appendChild(hud);

      document.getElementById('close-mcp-hud-btn').addEventListener('click', () => {
        this.toggleHUD();
      });
    }
  };

  window.AntigravityMCP = AntigravityMCP;
})();
