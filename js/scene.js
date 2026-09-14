/* ==========================================================================
   Roxwood Network — Fond animé « galaxy » premium (composant autonome)

   Contenu :
   - Nébuleuses douces pré-rendues (cyan / violet / magenta) en parallaxe lente.
   - 4 couches d'étoiles (lointaines → proches) avec scintillement dynamique.
   - Halos lumineux discrets sur les étoiles proches.
   - Étoiles filantes fréquentes : trajectoires, vitesses et couleurs variées,
     traînées lumineuses lissées.
   - Parallaxe curseur / doigt / inclinaison avec inertie douce.
   - Léger « warp » (étirement des étoiles) quand la souris bouge vite.
   - Micro-explosions de particules au clic / au toucher.

   Contraintes respectées :
   - Canvas 2D unique, fixe, z-index négatif, pointer-events:none (jamais
     d'interception de clic : les entrées sont écoutées sur window).
   - Budget maîtrisé : densité réduite sur mobile, cap FPS, pause hors écran.
   - Fallback statique si « prefers-reduced-motion » ou animations coupées.
   ========================================================================== */

(function () {
  "use strict";

  if (window.__roxwoodScene) return; // un seul décor par page
  window.__roxwoodScene = true;

  /* ---------------------------------------------------------------------- */
  /* Styles injectés (composant autonome)                                   */
  /* ---------------------------------------------------------------------- */
  var CSS = [
    ".galaxy-bg{position:fixed;inset:0;z-index:-4;display:block;pointer-events:none}",
    ".galaxy-shade{position:fixed;inset:0;z-index:-3;pointer-events:none;",
    "background:radial-gradient(120% 90% at 50% 0%,rgba(5,7,15,0),rgba(5,7,15,.4) 70%,rgba(5,7,15,.68)),",
    "linear-gradient(180deg,rgba(5,7,15,.22),rgba(5,7,15,.46))}"
  ].join("");

  /* Couches d'étoiles : depth = amplitude de parallaxe (px) */
  var LAYERS = [
    { count: 170, depth: 4, size: [0.4, 0.9], alpha: [0.20, 0.45], speed: 0.5, glow: false },
    { count: 110, depth: 12, size: [0.7, 1.3], alpha: [0.30, 0.65], speed: 0.9, glow: false },
    { count: 70, depth: 26, size: [1.0, 1.9], alpha: [0.45, 0.85], speed: 1.3, glow: true },
    { count: 34, depth: 44, size: [1.4, 2.6], alpha: [0.55, 1.00], speed: 1.8, glow: true }
  ];

  var STAR_COLORS = ["#e6f8ff", "#a9e6ff", "#7ad7ff", "#c9b7ff", "#ffb9f0"];
  var SHOOT_COLORS = ["#8ce6ff", "#c9b7ff", "#ff9de8", "#ffffff"];

  var EASE = 0.05;          // inertie du parallaxe
  var FPS_CAP = 60;
  var SHOOT_MIN = 700;      // délai mini entre deux étoiles filantes (ms)
  var SHOOT_MAX = 2200;
  var MAX_SHOOTERS = 14;
  var MAX_PARTICLES = 260;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function build() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var canvas = document.createElement("canvas");
    canvas.className = "galaxy-bg";
    canvas.setAttribute("aria-hidden", "true");
    var shade = document.createElement("div");
    shade.className = "galaxy-shade";
    shade.setAttribute("aria-hidden", "true");
    document.body.prepend(shade);
    document.body.prepend(canvas);

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var w = 0, h = 0, dpr = 1, mobile = false, amplitude = 1;
    var stars = [], shooters = [], particles = [];
    var nebula = null;

    /* -------------------------------------------------------------------- */
    /* Nébuleuses : pré-rendu unique (redessiné au resize seulement)         */
    /* -------------------------------------------------------------------- */
    function buildNebula() {
      var c = document.createElement("canvas");
      c.width = Math.max(Math.round(w / 2), 1);
      c.height = Math.max(Math.round(h / 2), 1);
      var g = c.getContext("2d");
      if (!g) return null;

      var blobs = [
        { x: 0.22, y: 0.28, r: 0.58, color: "rgba(34,211,255,0.22)" },
        { x: 0.76, y: 0.22, r: 0.52, color: "rgba(140,110,255,0.20)" },
        { x: 0.60, y: 0.72, r: 0.62, color: "rgba(217,38,198,0.17)" },
        { x: 0.10, y: 0.80, r: 0.46, color: "rgba(46,90,255,0.18)" },
        { x: 0.88, y: 0.62, r: 0.40, color: "rgba(120,60,255,0.14)" },
        { x: 0.48, y: 0.46, r: 0.78, color: "rgba(14,22,52,0.45)" }
      ];

      blobs.forEach(function (b) {
        var radius = b.r * Math.max(c.width, c.height);
        var grad = g.createRadialGradient(b.x * c.width, b.y * c.height, 0,
          b.x * c.width, b.y * c.height, radius);
        grad.addColorStop(0, b.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, c.width, c.height);
      });

      // Voile de poussière stellaire : quelques amas très diffus.
      for (var i = 0; i < 18; i++) {
        var cx = Math.random() * c.width;
        var cy = Math.random() * c.height;
        var r = rand(40, 160);
        var gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        gr.addColorStop(0, "rgba(180,220,255,0.05)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr;
        g.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      return c;
    }

    /* -------------------------------------------------------------------- */
    /* Étoiles                                                              */
    /* -------------------------------------------------------------------- */
    function seedStars() {
      stars = [];
      var density = mobile ? 0.5 : 1;
      LAYERS.forEach(function (layer, index) {
        var count = Math.round(layer.count * density);
        for (var i = 0; i < count; i++) {
          stars.push({
            layer: index,
            x: Math.random(),
            y: Math.random(),
            r: rand(layer.size[0], layer.size[1]),
            a: rand(layer.alpha[0], layer.alpha[1]),
            phase: Math.random() * Math.PI * 2,
            twinkle: rand(0.5, 2.2),
            color: pick(STAR_COLORS)
          });
        }
      });
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mobile = window.matchMedia("(max-width: 860px)").matches;
      amplitude = mobile ? 0.6 : 1;
      seedStars();
      nebula = buildNebula();
    }

    /* -------------------------------------------------------------------- */
    /* Étoiles filantes : trajectoires et vitesses variées                   */
    /* -------------------------------------------------------------------- */
    function spawnShooter() {
      if (shooters.length >= MAX_SHOOTERS) return;
      // Angle majoritairement diagonal, mais avec de la variété.
      var angle = rand(0.15, 0.62) * Math.PI * (Math.random() < 0.5 ? 1 : -1);
      if (Math.random() < 0.25) angle += Math.PI; // parfois de droite à gauche
      var speed = rand(340, 950) * (mobile ? 0.8 : 1);
      var len = rand(90, 240);
      var x = rand(-0.1, 1.1) * w;
      var y = rand(-0.15, 0.85) * h;
      shooters.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: len,
        life: 0,
        ttl: rand(0.7, 1.8),
        width: rand(0.9, 2.2),
        color: pick(SHOOT_COLORS)
      });
    }

    /* Petite explosion : au clic, ou à l'impact d'une étoile filante. */
    function burst(x, y, count, power, color) {
      for (var i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        var angle = Math.random() * Math.PI * 2;
        var speed = rand(30, power);
        particles.push({
          x: x, y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: rand(0.7, 2.1),
          life: 0,
          ttl: rand(0.5, 1.3),
          color: color || pick(SHOOT_COLORS)
        });
      }
    }

    /* -------------------------------------------------------------------- */
    /* Entrées (curseur, doigt, inclinaison, clic)                           */
    /* -------------------------------------------------------------------- */
    var target = { x: 0, y: 0 };
    var eased = { x: 0, y: 0 };
    var pointer = { x: 0, y: 0, vx: 0, vy: 0 };
    var warp = 0; // 0..1 : intensité de l'étirement des étoiles

    function setPointer(x, y) {
      pointer.vx = x - pointer.x;
      pointer.vy = y - pointer.y;
      pointer.x = x;
      pointer.y = y;
      target.x = (x / window.innerWidth) * 2 - 1;
      target.y = (y / window.innerHeight) * 2 - 1;
      // Vitesse du curseur → warp (saturé pour rester discret).
      var v = Math.min(Math.sqrt(pointer.vx * pointer.vx + pointer.vy * pointer.vy) / 60, 1);
      warp = Math.max(warp, v * 0.6); // plafonné : l'étirement reste discret
    }

    window.addEventListener("mousemove", function (e) {
      setPointer(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener("deviceorientation", function (e) {
      if (e.gamma == null || e.beta == null) return;
      target.x = Math.max(-1, Math.min(1, e.gamma / 35));
      target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
    }, { passive: true });

    // Clic (n'importe où sur la page, en phase de capture : n'empêche rien).
    function onTap(x, y) {
      if (isReduced()) return;
      var color = pick(SHOOT_COLORS);
      burst(x, y, mobile ? 16 : 26, 260, color);
      // …et deux étoiles filantes qui partent du point cliqué.
      var shots = 2 + Math.floor(Math.random() * 2);
      for (var i = 0; i < shots; i++) {
        if (shooters.length >= MAX_SHOOTERS) break;
        var angle = Math.random() * Math.PI * 2;
        var speed = rand(420, 900);
        shooters.push({
          x: x, y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          len: rand(70, 170),
          life: 0,
          ttl: rand(0.5, 1.1),
          width: rand(1, 2),
          color: color
        });
      }
    }

    window.addEventListener("pointerdown", function (e) {
      onTap(e.clientX, e.clientY);
    }, { passive: true, capture: true });

    window.addEventListener("resize", resize, { passive: true });

    /* -------------------------------------------------------------------- */
    /* Rendu                                                                */
    /* -------------------------------------------------------------------- */
    function drawStars(t, reduced) {
      var stretch = reduced ? 0 : warp;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var layer = LAYERS[s.layer];
        var dx = -eased.x * layer.depth * amplitude;
        var dy = -eased.y * layer.depth * 0.7 * amplitude;
        var driftX = reduced ? 0 : Math.sin(t * 0.03 * layer.speed + s.phase) * layer.depth * 0.3;
        var driftY = reduced ? 0 : Math.cos(t * 0.024 * layer.speed + s.phase) * layer.depth * 0.2;

        var x = s.x * w + dx + driftX;
        var y = s.y * h + dy + driftY;
        var alpha = reduced ? s.a : s.a * (0.68 + 0.32 * Math.sin(t * s.twinkle + s.phase));
        alpha = Math.max(0, Math.min(1, alpha));

        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;

        // Warp : étirement dans la direction du mouvement de la souris.
        var tail = stretch * layer.depth * 0.5;
        if (tail > 1.2) {
          var nx = pointer.vx, ny = pointer.vy;
          var norm = Math.sqrt(nx * nx + ny * ny) || 1;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.r * 1.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - (nx / norm) * tail, y - (ny / norm) * tail);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }

        if (layer.glow) {
          ctx.globalAlpha = alpha * 0.16;
          ctx.beginPath();
          ctx.arc(x, y, s.r * 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    function drawShooters(dt) {
      for (var i = shooters.length - 1; i >= 0; i--) {
        var s = shooters[i];
        s.life += dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        var fade = 1 - s.life / s.ttl;
        if (fade <= 0 || s.x < -300 || s.x > w + 300 || s.y < -300 || s.y > h + 300) {
          shooters.splice(i, 1);
          continue;
        }

        // Traînée : dégradé linéaire le long de la trajectoire.
        var norm = Math.sqrt(s.vx * s.vx + s.vy * s.vy) || 1;
        var tx = s.x - (s.vx / norm) * s.len;
        var ty = s.y - (s.vy / norm) * s.len;
        var grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
        grad.addColorStop(0, s.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.globalAlpha = Math.min(1, fade) * 0.9;
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Tête lumineuse
        ctx.globalAlpha = Math.min(1, fade);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.width * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawParticles(dt) {
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.life += dt;
        var fade = 1 - p.life / p.ttl;
        if (fade <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.965; // frottement : l'explosion s'éteint doucement
        p.vy *= 0.965;

        ctx.globalAlpha = fade * 0.85;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * fade + 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function draw(t, dt, reduced) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#050710";
      ctx.fillRect(0, 0, w, h);

      // Nébuleuses : couche la plus lointaine, parallaxe minime.
      if (nebula) {
        var nx = -eased.x * 12 * amplitude;
        var ny = -eased.y * 9 * amplitude;
        var drift = reduced ? 0 : Math.sin(t * 0.05) * 7;
        ctx.globalCompositeOperation = "screen";
        ctx.drawImage(nebula, nx + drift - 24, ny - 24, w + 48, h + 48);
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.globalCompositeOperation = "lighter";
      drawStars(t, reduced);
      if (!reduced) {
        drawShooters(dt);
        drawParticles(dt);
      }
      ctx.globalCompositeOperation = "source-over";
    }

    /* -------------------------------------------------------------------- */
    /* Boucle                                                               */
    /* -------------------------------------------------------------------- */
    var frameInterval = 1000 / FPS_CAP;
    var last = 0;
    var prev = 0;
    var nextShoot = 0;

    function isReduced() {
      return document.documentElement.classList.contains("reduce-motion") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function loop(time) {
      window.requestAnimationFrame(loop);
      if (document.hidden) { prev = time; return; }
      if (time - last < frameInterval) return;
      last = time;

      var dt = Math.min((time - prev) / 1000, 0.05) || 0.016;
      prev = time;

      var reduced = isReduced();
      var ease = reduced ? 1 : EASE;
      eased.x += ((reduced ? 0 : target.x) - eased.x) * ease;
      eased.y += ((reduced ? 0 : target.y) - eased.y) * ease;
      warp *= 0.90; // retour au calme progressif
      pointer.vx *= 0.90;
      pointer.vy *= 0.90;

      // Apparition aléatoire des étoiles filantes.
      if (!reduced && time > nextShoot) {
        spawnShooter();
        if (Math.random() < 0.3) spawnShooter(); // parfois en salve
        nextShoot = time + rand(SHOOT_MIN, SHOOT_MAX);
      }

      draw(time / 1000, dt, reduced);
    }

    resize();
    draw(0, 0.016, true); // première image immédiate
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
