/* ==========================================================================
   Roxwood Network — Décor interactif (galaxie + montagnes en profondeur)
   Couches nettes en images haute résolution, navigation à la souris / au doigt,
   dérive lente permanente et légère réaction au défilement.
   ========================================================================== */

(function () {
  "use strict";

  if (window.__roxwoodScene) return;
  window.__roxwoodScene = true;

  var CSS = [
    ".scene{position:fixed;inset:0;z-index:-4;overflow:hidden;pointer-events:none;perspective:1200px}",
    ".scene__layer{position:absolute;left:-7%;right:-7%;top:-7%;bottom:-7%;background-repeat:no-repeat;will-change:transform;backface-visibility:hidden;transform:translate3d(0,0,0);image-rendering:auto}",
    ".scene__sky{background-image:url('img/parallax-sky.jpg');background-size:cover;background-position:center;filter:saturate(1.04) contrast(1.02) brightness(.95)}",
    ".scene__far{background-image:url('img/parallax-mountains-far.png');background-size:106% auto;background-position:center 88%;opacity:.9;filter:brightness(.82) saturate(1.04)}",
    ".scene__near{background-image:url('img/parallax-mountains-near.png');background-size:112% auto;background-position:center bottom;filter:brightness(.78)}",

    ".scene__aurora{background:radial-gradient(760px 520px at 26% 34%,rgba(34,211,255,.20),transparent 68%),radial-gradient(680px 480px at 74% 62%,rgba(217,38,198,.16),transparent 70%);mix-blend-mode:screen}",
    ".scene__shade{position:fixed;inset:0;z-index:-3;pointer-events:none;background:linear-gradient(180deg,rgba(5,7,15,.24),rgba(5,7,15,.58)),linear-gradient(90deg,rgba(5,7,15,.5),rgba(5,7,15,.12) 52%,rgba(5,7,15,.38))}",
    ".reduce-motion .scene__layer{transition:none}"
  ].join("");

  var LAYERS = [
    { cls: "scene__sky", depth: 5, drift: 4 },
    { cls: "scene__aurora", depth: 12, drift: 10 },
    { cls: "scene__far", depth: 20, drift: 6 },
    { cls: "scene__near", depth: 38, drift: 9 }
  ];


  function build() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var scene = document.createElement("div");
    var shade = document.createElement("div");
    scene.className = "scene";
    scene.setAttribute("aria-hidden", "true");
    shade.className = "scene__shade";
    shade.setAttribute("aria-hidden", "true");

    var nodes = LAYERS.map(function (layer) {
      var el = document.createElement("div");
      el.className = "scene__layer " + layer.cls;
      scene.appendChild(el);
      return el;
    });

    document.body.prepend(shade);
    document.body.prepend(scene);

    var pointer = { x: 0, y: 0 };
    var eased = { x: 0, y: 0 };
    var scroll = 0;
    var easedScroll = 0;

    function onPointer(x, y) {
      pointer.x = (x / window.innerWidth) * 2 - 1;
      pointer.y = (y / window.innerHeight) * 2 - 1;
    }

    window.addEventListener("mousemove", function (event) {
      onPointer(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener("touchmove", function (event) {
      if (event.touches && event.touches[0]) onPointer(event.touches[0].clientX, event.touches[0].clientY);
    }, { passive: true });

    window.addEventListener("deviceorientation", function (event) {
      if (event.gamma === null || event.beta === null) return;
      pointer.x = Math.max(-1, Math.min(1, (event.gamma || 0) / 35));
      pointer.y = Math.max(-1, Math.min(1, ((event.beta || 0) - 45) / 35));
    }, { passive: true });

    window.addEventListener("scroll", function () {
      var max = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      scroll = Math.min(window.scrollY / max, 1);
    }, { passive: true });

    function frame(time) {
      var reduced = document.documentElement.classList.contains("reduce-motion");
      var ease = reduced ? 1 : 0.055;
      eased.x += (pointer.x - eased.x) * ease;
      eased.y += (pointer.y - eased.y) * ease;
      easedScroll += (scroll - easedScroll) * (reduced ? 1 : 0.08);

      var t = time / 1000;
      nodes.forEach(function (el, index) {
        var layer = LAYERS[index];
        var driftX = reduced ? 0 : Math.sin(t * 0.07 + index) * layer.drift;
        var driftY = reduced ? 0 : Math.cos(t * 0.05 + index * 1.7) * layer.drift * 0.5;
        var x = -eased.x * layer.depth + driftX;
        var y = -eased.y * layer.depth * 0.6 + driftY - easedScroll * layer.depth * 1.6;
        var zoom = 1 + layer.depth / 900 + easedScroll * 0.03;
        el.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) scale(" + zoom.toFixed(4) + ")";
      });

      window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
