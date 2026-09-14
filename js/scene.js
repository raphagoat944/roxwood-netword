/* ==========================================================================
   Roxwood Network — Décor animé de fond (galaxie + montagnes en silhouette)

   Objectif : un arrière-plan premium, profond et discret.
   - 4 couches empilées (ciel galaxie, halo néon, montagnes lointaines,
     montagnes proches) animées par transform GPU uniquement.
   - Parallaxe douce : la galaxie bouge peu, les montagnes davantage,
     avec inertie (lerp) et dérive lente permanente.
   - Réactif au curseur, au doigt et à l'inclinaison de l'appareil.
   - Voile assombrissant au-dessus pour garantir la lisibilité du contenu.
   - Zéro interception de clic (pointer-events: none, z-index négatif).
   - Fallback statique si « prefers-reduced-motion » ou animations désactivées.
   - Animation en pause quand l'onglet est masqué (économie GPU).
   ========================================================================== */

(function () {
  "use strict";

  // Un seul décor par page, même si le script est inclus deux fois.
  if (window.__roxwoodScene) return;
  window.__roxwoodScene = true;

  /* ----------------------------------------------------------------------
     Styles du décor (injectés pour garder le composant autonome)
     ---------------------------------------------------------------------- */
  var CSS = [
    // Conteneur : plein écran, fixe, derrière tout, jamais cliquable.
    ".scene{position:fixed;inset:0;z-index:-4;overflow:hidden;pointer-events:none}",
    // Couches : légèrement débordantes pour ne jamais révéler de bord.
    ".scene__layer{position:absolute;left:-7%;right:-7%;top:-7%;bottom:-7%;",
    "background-repeat:no-repeat;will-change:transform;backface-visibility:hidden;",
    "transform:translate3d(0,0,0)}",
    // Ciel galaxie : couche la plus lointaine, donc la plus lente.
    ".scene__sky{background-image:url('img/parallax-sky.jpg');background-size:cover;",
    "background-position:center;filter:saturate(1.04) contrast(1.02) brightness(.95)}",
    // Halo néon très doux (cyan + magenta) pour l'ambiance.
    ".scene__aurora{background:radial-gradient(760px 520px at 26% 34%,rgba(34,211,255,.16),transparent 68%),",
    "radial-gradient(680px 480px at 74% 62%,rgba(217,38,198,.13),transparent 70%);mix-blend-mode:screen}",
    // Montagnes lointaines : silhouette bleu nuit atténuée.
    ".scene__far{background-image:url('img/parallax-mountains-far.png');background-size:106% auto;",
    "background-position:center 88%;opacity:.9;filter:brightness(.82) saturate(1.04)}",
    // Montagnes proches : silhouette sombre, la plus réactive.
    ".scene__near{background-image:url('img/parallax-mountains-near.png');background-size:112% auto;",
    "background-position:center bottom;filter:brightness(.78)}",
    // Voile de lisibilité, au-dessus du décor et sous le contenu.
    ".scene__shade{position:fixed;inset:0;z-index:-3;pointer-events:none;",
    "background:linear-gradient(180deg,rgba(5,7,15,.26),rgba(5,7,15,.6)),",
    "linear-gradient(90deg,rgba(5,7,15,.5),rgba(5,7,15,.12) 52%,rgba(5,7,15,.38))}"
  ].join("");

  /* ----------------------------------------------------------------------
     Configuration des couches
     depth : amplitude du déplacement au curseur (px)
     drift : amplitude de la dérive lente permanente (px)
     ---------------------------------------------------------------------- */
  var LAYERS = [
    { cls: "scene__sky", depth: 5, drift: 4 },
    { cls: "scene__aurora", depth: 12, drift: 10 },
    { cls: "scene__far", depth: 20, drift: 6 },
    { cls: "scene__near", depth: 38, drift: 9 }
  ];

  var EASE_POINTER = 0.05; // inertie du suivi curseur (plus bas = plus doux)
  var EASE_SCROLL = 0.07;
  var FPS_CAP = 45; // suffisant pour un mouvement lent, plus léger pour le GPU

  function build() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var scene = document.createElement("div");
    scene.className = "scene";
    scene.setAttribute("aria-hidden", "true");

    var shade = document.createElement("div");
    shade.className = "scene__shade";
    shade.setAttribute("aria-hidden", "true");

    var nodes = LAYERS.map(function (layer) {
      var el = document.createElement("div");
      el.className = "scene__layer " + layer.cls;
      scene.appendChild(el);
      return el;
    });

    // Insérés en tête du body : ils restent derrière toute la structure.
    document.body.prepend(shade);
    document.body.prepend(scene);

    /* --------------------------------------------------------------------
       État d'entrée (curseur, inclinaison, défilement) + valeurs lissées
       -------------------------------------------------------------------- */
    var target = { x: 0, y: 0 };
    var eased = { x: 0, y: 0 };
    var scroll = 0;
    var easedScroll = 0;
    var mobile = window.matchMedia("(max-width: 860px)").matches;
    var amplitude = mobile ? 0.6 : 1; // mouvement réduit sur petit écran

    function setPointer(x, y) {
      target.x = (x / window.innerWidth) * 2 - 1;
      target.y = (y / window.innerHeight) * 2 - 1;
    }

    window.addEventListener("mousemove", function (event) {
      setPointer(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener("touchmove", function (event) {
      if (event.touches && event.touches[0]) {
        setPointer(event.touches[0].clientX, event.touches[0].clientY);
      }
    }, { passive: true });

    // Inclinaison de l'appareil : même effet de profondeur sans curseur.
    window.addEventListener("deviceorientation", function (event) {
      if (event.gamma == null || event.beta == null) return;
      target.x = Math.max(-1, Math.min(1, event.gamma / 35));
      target.y = Math.max(-1, Math.min(1, (event.beta - 45) / 35));
    }, { passive: true });

    window.addEventListener("scroll", function () {
      var max = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      scroll = Math.min(window.scrollY / max, 1);
    }, { passive: true });

    window.addEventListener("resize", function () {
      mobile = window.matchMedia("(max-width: 860px)").matches;
      amplitude = mobile ? 0.6 : 1;
    }, { passive: true });

    /* --------------------------------------------------------------------
       Rendu : une seule écriture de transform par couche et par frame
       -------------------------------------------------------------------- */
    function render(t, reduced) {
      nodes.forEach(function (el, index) {
        var layer = LAYERS[index];
        var driftX = reduced ? 0 : Math.sin(t * 0.07 + index) * layer.drift;
        var driftY = reduced ? 0 : Math.cos(t * 0.05 + index * 1.7) * layer.drift * 0.5;
        var x = -eased.x * layer.depth * amplitude + driftX;
        var y = -eased.y * layer.depth * 0.6 * amplitude + driftY - easedScroll * layer.depth * 1.4;
        var zoom = 1 + layer.depth / 1600 + easedScroll * 0.02;
        el.style.transform =
          "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) scale(" + zoom.toFixed(4) + ")";
      });
    }

    var frameInterval = 1000 / FPS_CAP;
    var lastFrame = 0;

    function loop(time) {
      window.requestAnimationFrame(loop);

      // Onglet masqué : rien à dessiner.
      if (document.hidden) return;

      // Fallback statique : position neutre, aucune dérive.
      var reduced = document.documentElement.classList.contains("reduce-motion") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (time - lastFrame < frameInterval) return;
      lastFrame = time;

      var ease = reduced ? 1 : EASE_POINTER;
      eased.x += ((reduced ? 0 : target.x) - eased.x) * ease;
      eased.y += ((reduced ? 0 : target.y) - eased.y) * ease;
      easedScroll += (scroll - easedScroll) * (reduced ? 1 : EASE_SCROLL);

      render(time / 1000, reduced);
    }

    render(0, true); // première image immédiate, avant toute interaction
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
