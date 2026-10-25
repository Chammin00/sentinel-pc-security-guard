/**
 * 🌌 Cosmic Cityscape - Universal Living Background System
 * Replicates the 3D Monopoly Living Screensaver Background:
 * - 3D Perspective Tilt & Parallax Layers
 * - Idle Sine-Wave Auto-Drift & Ken Burns Breathing Zoom
 * - 220 Twinkling Multi-Color Stars & Comets
 * - Water Surface Shimmer Particles
 * - Atmospheric Planet Glows, Sun Flare & City Horizon Reflections
 */

(function () {
  // Prevent duplicate initialization
  if (window.__cosmicBackgroundInitialized) return;
  window.__cosmicBackgroundInitialized = true;

  function init() {
    // 1. Determine image source URL
    // Auto-detect relative path from script location or default to local directory
    var imageSrc = 'cosmic_cityscape.jpg';
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].src;
      if (s && s.indexOf('cosmic-background.js') !== -1) {
        var dir = s.substring(0, s.lastIndexOf('/') + 1);
        imageSrc = dir + 'cosmic_cityscape.jpg';
        break;
      }
    }

    // 2. Inject CSS Styles
    var styleId = 'cosmic-background-styles';
    if (!document.getElementById(styleId)) {
      var style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Living Screensaver Background Elements */
        #screensaver-scene {
          position: fixed !important;
          inset: 0 !important;
          z-index: -2 !important;
          perspective: 1200px !important;
          transform-style: preserve-3d !important;
          overflow: hidden !important;
          pointer-events: none !important;
        }

        .screensaver-layer {
          position: absolute !important;
          inset: -8% !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          background-size: cover !important;
          will-change: transform !important;
          transition: transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }

        #screensaver-layer-base {
          z-index: 1 !important;
          filter: brightness(0.92) saturate(1.15) !important;
          background-image: url('${imageSrc}'), url('cosmic_cityscape.jpg'), url('../cosmic_cityscape.jpg');
        }

        #screensaver-layer-dark {
          z-index: 2 !important;
          pointer-events: none !important;
          background: radial-gradient(ellipse 75% 55% at 50% 30%, transparent 50%, rgba(0, 0, 15, 0.55) 100%) !important;
        }

        #screensaver-star-canvas {
          position: fixed !important;
          inset: 0 !important;
          z-index: -1 !important;
          pointer-events: none !important;
          width: 100% !important;
          height: 100% !important;
        }

        #screensaver-planet-glow {
          position: fixed !important;
          z-index: -1 !important;
          pointer-events: none !important;
          inset: 0 !important;
          background:
            radial-gradient(ellipse 28% 22% at 48% 26%, rgba(180, 100, 255, 0.22) 0%, transparent 70%),
            radial-gradient(ellipse 14% 12% at 82% 15%, rgba(255, 160, 60, 0.18) 0%, transparent 70%),
            radial-gradient(ellipse 12% 10% at 12% 22%, rgba(255, 200, 80, 0.24) 0%, transparent 70%) !important;
          animation: screensaverPlanetPulse 6s ease-in-out infinite alternate !important;
        }

        @keyframes screensaverPlanetPulse {
          0%   { opacity: 0.55; }
          50%  { opacity: 1.0; }
          100% { opacity: 0.65; }
        }

        #screensaver-sun-flare {
          position: fixed !important;
          z-index: -1 !important;
          pointer-events: none !important;
          left: 6% !important;
          top: 12% !important;
          width: 260px !important;
          height: 260px !important;
          background: radial-gradient(circle, rgba(255, 200, 80, 0.6) 0%, rgba(255, 120, 0, 0.22) 40%, transparent 70%) !important;
          border-radius: 50% !important;
          animation: screensaverFlarePulse 4s ease-in-out infinite alternate !important;
          transform: translate(-30%, -30%) !important;
        }

        @keyframes screensaverFlarePulse {
          0%   { transform: translate(-30%, -30%) scale(0.85); opacity: 0.65; }
          100% { transform: translate(-30%, -30%) scale(1.18); opacity: 1.0; }
        }

        #screensaver-water-shimmer {
          position: fixed !important;
          z-index: -1 !important;
          pointer-events: none !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 25% !important;
          background: linear-gradient(to top, rgba(255, 100, 30, 0.15) 0%, rgba(255, 140, 60, 0.08) 45%, transparent 100%) !important;
          animation: screensaverWaterShimmer 3.5s ease-in-out infinite alternate !important;
        }

        @keyframes screensaverWaterShimmer {
          0%   { opacity: 0.45; transform: scaleX(1.0); }
          100% { opacity: 1.0; transform: scaleX(1.02); }
        }

        #screensaver-city-glow {
          position: fixed !important;
          z-index: -1 !important;
          pointer-events: none !important;
          left: 0 !important;
          bottom: 15% !important;
          width: 38% !important;
          height: 32% !important;
          background: radial-gradient(ellipse at 30% 80%, rgba(255, 180, 60, 0.25) 0%, transparent 70%) !important;
          animation: screensaverCityGlow 5s ease-in-out infinite alternate !important;
        }

        @keyframes screensaverCityGlow {
          0%   { opacity: 0.55; }
          100% { opacity: 1.0; }
        }

        @keyframes screensaverBreatheZoom {
          0%   { transform: scale(1.00); }
          50%  { transform: scale(1.045); }
          100% { transform: scale(1.00); }
        }

        .breathing #screensaver-layer-base {
          animation: screensaverBreatheZoom 18s ease-in-out infinite !important;
        }

        /* Glassmorphism styling enhancements for apps */
        .cosmic-glass {
          background: rgba(15, 23, 42, 0.78) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
        }
      `;
      document.head.appendChild(style);
    }

    // 3. Inject DOM Structure if not already present
    if (!document.getElementById('screensaver-scene')) {
      var scene = document.createElement('div');
      scene.id = 'screensaver-scene';
      scene.className = 'breathing';
      scene.innerHTML = `
        <div class="screensaver-layer" id="screensaver-layer-base"></div>
        <div class="screensaver-layer" id="screensaver-layer-dark"></div>
      `;

      var starCanvas = document.createElement('canvas');
      starCanvas.id = 'screensaver-star-canvas';

      var planetGlow = document.createElement('div');
      planetGlow.id = 'screensaver-planet-glow';

      var sunFlare = document.createElement('div');
      sunFlare.id = 'screensaver-sun-flare';

      var waterShimmer = document.createElement('div');
      waterShimmer.id = 'screensaver-water-shimmer';

      var cityGlow = document.createElement('div');
      cityGlow.id = 'screensaver-city-glow';

      var fragment = document.createDocumentFragment();
      fragment.appendChild(scene);
      fragment.appendChild(starCanvas);
      fragment.appendChild(planetGlow);
      fragment.appendChild(sunFlare);
      fragment.appendChild(waterShimmer);
      fragment.appendChild(cityGlow);

      if (document.body.firstChild) {
        document.body.insertBefore(fragment, document.body.firstChild);
      } else {
        document.body.appendChild(fragment);
      }
    }

    // 4. Parallax & Particle Engine
    var baseLayer = document.getElementById('screensaver-layer-base');
    var darkLayer = document.getElementById('screensaver-layer-dark');
    var planetGlowElem = document.getElementById('screensaver-planet-glow');
    var sunFlareElem = document.getElementById('screensaver-sun-flare');
    var cityGlowElem = document.getElementById('screensaver-city-glow');
    var canvas = document.getElementById('screensaver-star-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var motionEnabled = true;
    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var currentX = mouseX;
    var currentY = mouseY;
    var targetX = mouseX;
    var targetY = mouseY;
    var lastMouseMove = Date.now();
    var autoAngle = 0;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      lastMouseMove = Date.now();
    });

    window.addEventListener('keydown', function (e) {
      if (e.key && e.key.toLowerCase() === 'm' && !e.target.matches('input, textarea, select, [contenteditable]')) {
        motionEnabled = !motionEnabled;
        var sc = document.getElementById('screensaver-scene');
        if (sc) {
          if (motionEnabled) {
            sc.classList.add('breathing');
          } else {
            sc.classList.remove('breathing');
            if (baseLayer) baseLayer.style.transform = '';
            if (darkLayer) darkLayer.style.transform = '';
            if (planetGlowElem) planetGlowElem.style.transform = '';
            if (sunFlareElem) sunFlareElem.style.transform = '';
            if (cityGlowElem) cityGlowElem.style.transform = '';
          }
        }
      }
    });

    // Generate Stars (Upper 65% of screen)
    var stars = Array.from({ length: 220 }, function () {
      return {
        x: Math.random(),
        y: Math.random() * 0.65,
        r: Math.random() * 1.4 + 0.2,
        base: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.8 + 0.3,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.85 ? '#ffe0a0' : '#e0f0ff'
      };
    });

    // Comets
    var comets = [];
    var cometTimer = 0;
    function spawnComet() {
      var fromLeft = Math.random() > 0.5;
      comets.push({
        x: fromLeft ? -0.05 : 1.05,
        y: Math.random() * 0.4 + 0.05,
        vx: (fromLeft ? 1 : -1) * (Math.random() * 0.004 + 0.003),
        vy: Math.random() * 0.002 + 0.001,
        alpha: 1,
        life: 0
      });
    }

    // Water Shimmer Particles (Bottom 25%)
    var shimmers = Array.from({ length: 45 }, function () {
      return {
        x: Math.random(),
        y: 0.78 + Math.random() * 0.19,
        size: Math.random() * 2.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
        spd: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.5 ? '#ff7030' : '#ffb040'
      };
    });

    var animTime = 0;
    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function animate() {
      requestAnimationFrame(animate);

      // Parallax calculations
      if (motionEnabled) {
        var idle = Date.now() - lastMouseMove > 3000;
        if (idle) {
          autoAngle += 0.004;
          targetX = window.innerWidth / 2 + Math.sin(autoAngle * 0.7) * 280;
          targetY = window.innerHeight / 2 + Math.cos(autoAngle * 0.5) * 180;
        } else {
          targetX = mouseX;
          targetY = mouseY;
        }

        currentX = lerp(currentX, targetX, 0.04);
        currentY = lerp(currentY, targetY, 0.04);

        var cx = window.innerWidth / 2;
        var cy = window.innerHeight / 2;
        var nx = cx ? (currentX - cx) / cx : 0;
        var ny = cy ? (currentY - cy) / cy : 0;

        var maxTilt = 6;
        var maxShift = 18;

        if (baseLayer) {
          baseLayer.style.transform =
            'rotateX(' + (-ny * maxTilt) + 'deg) rotateY(' + (nx * maxTilt) + 'deg) ' +
            'translateX(' + (-nx * maxShift) + 'px) translateY(' + (-ny * maxShift) + 'px)';
        }
        if (darkLayer) {
          darkLayer.style.transform =
            'rotateX(' + (-ny * maxTilt * 0.5) + 'deg) rotateY(' + (nx * maxTilt * 0.5) + 'deg) ' +
            'translateX(' + (-nx * 10) + 'px) translateY(' + (-ny * 10) + 'px)';
        }
        if (planetGlowElem) {
          planetGlowElem.style.transform =
            'translateX(' + (nx * 25) + 'px) translateY(' + (ny * 25) + 'px)';
        }
        if (sunFlareElem) {
          sunFlareElem.style.transform =
            'translate(calc(-30% + ' + (nx * 35) + 'px), calc(-30% + ' + (ny * 35) + 'px))';
        }
        if (cityGlowElem) {
          cityGlowElem.style.transform =
            'translateX(' + (nx * 8) + 'px) translateY(' + (ny * 8) + 'px)';
        }
      }

      // Canvas Drawing
      var W = canvas.width;
      var H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      animTime += 0.016;
      cometTimer += 0.016;

      if (cometTimer > 8 + Math.random() * 6) {
        spawnComet();
        cometTimer = 0;
      }

      // Draw Stars
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var alpha = Math.max(0, Math.min(1, s.base + Math.sin(animTime * s.speed + s.phase) * 0.35));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.shadowBlur = s.r * 4;
        ctx.shadowColor = s.color;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Draw Comets
      for (var j = comets.length - 1; j >= 0; j--) {
        var c = comets[j];
        c.x += c.vx;
        c.y += c.vy;
        c.life += 0.016;
        c.alpha = Math.max(0, 1 - c.life * 0.5);

        var x1 = c.x * W;
        var y1 = c.y * H;
        var len = 0.09;
        var x0 = x1 - (c.vx * len * W) / Math.abs(c.vx);
        var y0 = y1 - (c.vy * len * H) / Math.abs(c.vy || 0.001) * 0.5;

        var grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(220,230,255,' + (c.alpha * 0.85) + ')');

        ctx.globalAlpha = c.alpha;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(180,210,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x0, y0);
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (c.alpha <= 0 || c.x < -0.15 || c.x > 1.15) {
          comets.splice(j, 1);
        }
      }

      // Draw Water Shimmer
      for (var k = 0; k < shimmers.length; k++) {
        var sm = shimmers[k];
        var pulse = 0.3 + 0.7 * Math.abs(Math.sin(animTime * sm.spd + sm.phase));
        ctx.globalAlpha = pulse * 0.55;
        ctx.fillStyle = sm.color;
        ctx.shadowBlur = sm.size * 3;
        ctx.shadowColor = sm.color;
        ctx.beginPath();
        ctx.arc(sm.x * W, sm.y * H, sm.size * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
