/* ==========================================================================
   Roxwood Network — Fond animé « galaxy » (composant autonome)

   - Canvas 2D unique, plein écran, fixe, derrière tout le contenu.
   - Profondeur : 3 couches d'étoiles (lointaines → proches) + nébuleuses.
   - Parallaxe curseur / doigt / inclinaison avec inertie douce (lerp).
   - Dérive lente permanente, scintillement subtil, halos néon discrets.
   - Nébuleuses pré-rendues une fois (offscreen) : coût GPU/CPU minimal.
   - Jamais cliquable (pointer-events:none, z-index négatif).
   - Fallback statique si « prefers-reduced-motion » ou animations coupées.
   - Pause automatique quand l'onglet est masqué.
   ========================================================================== */

(function () {
  "use strict";

  // Un seul décor par page, même si le script est inclus deux fois.
  if (window.__roxwoodScene) return;
  window.__roxwoodScene = true;

  /* ---------------------------------------------------------------------- */
  /* Styles (injectés pour garder le composant autonome)                     */
  /* ---------------------------------------------------------------------- */
  var CSS = [
    ".galaxy-bg{position:fixed;inset:0;z-index:-4;display:block;pointer-events:none}",
    // Voile de lisibilité : au-dessus du fond, sous le contenu.
    ".galaxy-shade{position:fixed;inset:0;z-index:-3;pointer-events:none;",
    "background:radial-gradient(120% 90% at 50% 0%,rgba(5,7,15,0),rgba(5,7,15,.45) 70%,rgba(5,7,15,.72)),",
    "linear-gradient(180deg,rgba(5,7,15,.28),rgba(5,7,15,.5))}"
  ].join("");

  /* Couches d'étoiles : depth = amplitude de parallaxe (px), size/alpha visuels */
  var LAYERS = [
    { count: 150, depth: 6, size: [0.5, 1.0], alpha: [0.25, 0.55], speed: 0.6 },
    { count: 90, depth: 16, size: [0.8, 1.6], alpha: [0.35, 0.75], speed: 1.0 },
    { count: 45, depth: 34, size: [1.2, 2.4], alpha: [0.5, 0.95], speed: 1.6 }
  ];

  var EASE = 0.045;     // inertie du suivi curseur
  var FPS_CAP = 45;     // mouvement lent : 45 fps suffit
  var COLORS = ["#dff6ff", "#a9e6ff", "#c9b7ff", "#ffc7f2"];

  function rand(min, max) { return min + Math.random() * (max - min); }

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

    var w = 0, h = 0, dpr = 1;
    var mobile = false, amplitude = 1;
    var stars = [];        // toutes les étoiles, avec leur couche
    var nebula = null;     // canvas offscreen des nébuleuses

    /* -------------------------------------------------------------------- */
    /* Nébuleuses : pré-rendu unique, redessiné seulement au resize          */
    /* -------------------------------------------------------------------- */
    function buildNebula() {
      var c = document.createElement("canvas");
      c.width = Math.max(Math.round(w / 2), 1);
      c.height = Math.max(Math.round(h / 2), 1);
      var g = c.getContext("2d");
      if (!g) return null;

      var blobs = [
        { x: 0.24, y: 0.3, r: 0.55, color: "rgba(34,211,255,0.20)" },
        { x: 0.78, y: 0.26, r: 0.5, color: "rgba(140,110,255,0.18)" },
        { x: 0.62, y: 0.74, r: 0.6, color: "rgba(217,38,198,0.15)" },
        { x: 0.12, y: 0.82, r: 0.45, color: "rgba(46,90,255,0.16)" },
        { x: 0.5, y: 0.5, r: 0.75, color: "rgba(12,20,48,0.5)" }
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

      return c;
    }

    /* -------------------------------------------------------------------- */
    /* Étoiles                                                               */
    /* -------------------------------------------------------------------- */
    function seedStars() {
      stars = [];
      var density = mobile ? 0.55 : 1;
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
            twinkle: rand(0.4, 1.4),
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
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
    /* Entrées (curseur / doigt / inclinaison)                               */
    /* -------------------------------------------------------------------- */
    var target = { x: 0, y: 0 };
    var eased = { x: 0, y: 0 };

    function setPointer(x, y) {
      target.x = (x / window.innerWidth) * 2 - 1;
      target.y = (y / window.innerHeight) * 2 - 1;
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

    window.addEventListener("resize", resize, { passive: true });

    /* -------------------------------------------------------------------- */
    /* Rendu                                                                 */
    /* -------------------------------------------------------------------- */
    function draw(t, reduced) {
      ctx.clearRect(0, 0, w, h);

      // Fond profond
      ctx.fillStyle = "#050710";
      ctx.fillRect(0, 0, w, h);

      // Nébuleuses (couche la plus lointaine : parallaxe minime)
      if (nebula) {
        var nx = -eased.x * 10 * amplitude;
        var ny = -eased.y * 8 * amplitude;
        var drift = reduced ? 0 : Math.sin(t * 0.05) * 6;
        ctx.globalCompositeOperation = "screen";
        ctx.drawImage(nebula, nx + drift - 20, ny - 20, w + 40, h + 40);
        ctx.globalCompositeOperation = "source-over";
      }

      // Étoiles par couche : plus la couche est proche, plus elle se déplace.
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var layer = LAYERS[s.layer];
        var dx = -eased.x * layer.depth * amplitude;
        var dy = -eased.y * layer.depth * 0.7 * amplitude;
        var driftX = reduced ? 0 : Math.sin(t * 0.03 * layer.speed + s.phase) * layer.depth * 0.35;
        var driftY = reduced ? 0 : Math.cos(t * 0.024 * layer.speed + s.phase) * layer.depth * 0.22;

        var x = s.x * w + dx + driftX;
        var y = s.y * h + dy + driftY;
        var alpha = reduced ? s.a : s.a * (0.72 + 0.28 * Math.sin(t * s.twinkle + s.phase));

        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();

        // Halo doux uniquement pour les étoiles proches (coût maîtrisé).
        if (s.layer === 2) {
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.18));
          ctx.beginPath();
          ctx.arc(x, y, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    /* -------------------------------------------------------------------- */
    /* Boucle                                                                */
    /* -------------------------------------------------------------------- */
    var frameInterval = 1000 / FPS_CAP;
    var last = 0;

    function isReduced() {
      return document.documentElement.classList.contains("reduce-motion") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function loop(time) {
      window.requestAnimationFrame(loop);
      if (document.hidden) return;
      if (time - last < frameInterval) return;
      last = time;

      var reduced = isReduced();
      var ease = reduced ? 1 : EASE;
      eased.x += ((reduced ? 0 : target.x) - eased.x) * ease;
      eased.y += ((reduced ? 0 : target.y) - eased.y) * ease;

      draw(time / 1000, reduced);
    }

    resize();
    draw(0, true); // première image immédiate
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
