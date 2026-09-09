/* ==========================================================================
   Roxwood Network — Script commun
   1. Ciel spatial              2. Header / footer partagés
   3. Menu mobile               4. Révélations au scroll
   5. Parallax du hero          6. Slider de preview
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- 1. Ciel spatial commun ---------- */
  function initSpaceBackground() {
    var canvas = document.createElement("canvas");
    var glow = document.createElement("div");
    canvas.className = "space-background";
    canvas.setAttribute("aria-hidden", "true");
    glow.className = "space-background__glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.prepend(glow);
    document.body.prepend(canvas);

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var width = 0;
    var height = 0;
    var dpr = 1;
    var centerX = 0;
    var centerY = 0;
    var stars = [];
    var shooters = [];
    var animationFrame = 0;
    var previousTime = 0;
    var staticDrawn = false;

    function createStar(nearCenter) {
      var angle = Math.random() * Math.PI * 2;
      var radius = nearCenter
        ? Math.random() * 34
        : Math.random() * Math.max(width, height) * 0.62;
      var colorRoll = Math.random();
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius * 0.82,
        previousX: 0,
        previousY: 0,
        firstFrame: true,
        depth: Math.random() * 0.84 + 0.16,
        twinkle: Math.random() * Math.PI * 2,
        color: colorRoll > 0.9 ? "217,38,198" : (colorRoll > 0.48 ? "34,211,255" : "230,240,255")
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      centerX = width * 0.5;
      centerY = height * 0.46;
      var density = width < 700 ? 7600 : 5600;
      var count = Math.min(240, Math.max(75, Math.round(width * height / density)));
      stars = Array.from({ length: count }, function () { return createStar(false); });
      shooters = [];
      staticDrawn = false;
    }

    function spawnShooter() {
      var angle = Math.PI * (0.14 + Math.random() * 0.18);
      shooters.push({
        x: Math.random() * width * 0.7,
        y: Math.random() * height * 0.34,
        velocityX: Math.cos(angle) * 900,
        velocityY: Math.sin(angle) * 900,
        life: 1
      });
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      stars.forEach(function (star) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, 0.45 + star.depth * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + star.color + ",0.68)";
        ctx.fill();
      });
    }

    function frame(time) {
      var reduced = document.documentElement.classList.contains("reduce-motion");
      if (reduced) {
        if (!staticDrawn) {
          drawStatic();
          staticDrawn = true;
        }
        previousTime = time;
        animationFrame = window.requestAnimationFrame(frame);
        return;
      }

      staticDrawn = false;
      var delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0.016;
      previousTime = time;
      ctx.clearRect(0, 0, width, height);

      stars.forEach(function (star, index) {
        var dx = star.x - centerX;
        var dy = star.y - centerY;
        var length = Math.hypot(dx, dy) || 1;
        var speed = 8 + star.depth * 24;
        star.x += dx / length * speed * star.depth * delta;
        star.y += (dy / length * speed * star.depth - 2.2 * star.depth) * delta;

        if (star.x < -45 || star.x > width + 45 || star.y < -45 || star.y > height + 45) {
          stars[index] = createStar(true);
          return;
        }

        var twinkle = 0.28 + 0.68 * Math.abs(Math.sin(time * 0.001 * (0.55 + star.depth) + star.twinkle));
        var radius = 0.35 + star.depth * 1.35;
        if (!star.firstFrame) {
          ctx.beginPath();
          ctx.moveTo(star.previousX, star.previousY);
          ctx.lineTo(star.x, star.y);
          ctx.strokeStyle = "rgba(" + star.color + "," + (twinkle * 0.38 * star.depth).toFixed(3) + ")";
          ctx.lineWidth = radius;
          ctx.stroke();
        }
        star.previousX = star.x;
        star.previousY = star.y;
        star.firstFrame = false;

        ctx.beginPath();
        ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + star.color + "," + twinkle.toFixed(3) + ")";
        ctx.shadowBlur = radius * 5;
        ctx.shadowColor = "rgba(" + star.color + ",0.5)";
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      if (Math.random() < delta * 0.24 && shooters.length < 2) spawnShooter();
      for (var i = shooters.length - 1; i >= 0; i -= 1) {
        var shooter = shooters[i];
        shooter.x += shooter.velocityX * delta;
        shooter.y += shooter.velocityY * delta;
        shooter.life -= delta * 1.35;
        if (shooter.life <= 0 || shooter.x > width + 100 || shooter.y > height + 100) {
          shooters.splice(i, 1);
          continue;
        }
        var gradient = ctx.createLinearGradient(
          shooter.x,
          shooter.y,
          shooter.x - shooter.velocityX * 0.095,
          shooter.y - shooter.velocityY * 0.095
        );
        gradient.addColorStop(0, "rgba(240,250,255," + (shooter.life * 0.9).toFixed(3) + ")");
        gradient.addColorStop(1, "rgba(34,211,255,0)");
        ctx.beginPath();
        ctx.moveTo(shooter.x, shooter.y);
        ctx.lineTo(shooter.x - shooter.velocityX * 0.095, shooter.y - shooter.velocityY * 0.095);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.7;
        ctx.stroke();
      }

      animationFrame = window.requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    animationFrame = window.requestAnimationFrame(frame);
    window.addEventListener("pagehide", function () {
      window.cancelAnimationFrame(animationFrame);
    }, { once: true });
  }

  /* ---------- 2. Header & footer communs ---------- */
  var PAGES = [
    { href: "home.html", label: "Accueil" },
    { href: "services.html", label: "Services" },
    { href: "portfolio.html", label: "Portfolio" },
    { href: "membres.html", label: "Espace Membre" },
    { href: "https://discord.com/invite/dZDfarP8zT", label: "Lancer un projet", cta: true, external: true }
  ];

  function currentPage() {
    var file = window.location.pathname.split("/").pop();
    return file === "" ? "home.html" : file;
  }

  function buildHeader() {
    var host = document.querySelector("[data-header]");
    if (!host) return;
    var active = currentPage();
    // Les sous-pages restent rattachées à leur rubrique parente.
    if (active === "dashboard.html") active = "membres.html";

    var links = PAGES.map(function (p) {
      var cls = p.href === active ? ' class="is-active"' : "";
      if (p.cta) cls = ' class="nav-cta"';
      var attrs = "";
      if (p.external) attrs += ' target="_blank" rel="noopener"';
      return '<a href="' + p.href + '"' + cls + attrs + ">" + p.label + "</a>";
    }).join("");

    host.innerHTML =
      '<header class="site-header">' +
      '<div class="container nav">' +
      '<a class="brand" href="home.html">' +
      '<img src="img/logo.png" alt="Logo Roxwood Network">' +
      "<span><span class=\"brand-name\">Roxwood Network</span>" +
      '<span class="brand-sub">Agence digitale</span></span>' +
      "</a>" +
      '<button class="nav-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false">&#9776;</button>' +
      '<nav class="nav-links">' + links + "</nav>" +
      "</div></header>";

    var toggle = host.querySelector(".nav-toggle");
    var menu = host.querySelector(".nav-links");
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  function buildFooter() {
    var host = document.querySelector("[data-footer]");
    if (!host) return;

    var reduced = document.documentElement.classList.contains("reduce-motion");

    host.innerHTML =
      '<section class="community-section"><div class="container">' +
      '<span class="eyebrow eyebrow--magenta reveal">Communauté</span>' +
      '<h2 class="section-title reveal" data-delay="60">Tout passe par le Discord.</h2>' +
      '<div class="community-card reveal" data-delay="120">' +
      '<div class="community-card__body">' +
      '<h3>Le serveur Roxwood Network</h3>' +
      '<p>Ouverture de dossier client, suivi de projet, journal des livraisons et support après-vente : le serveur centralise tous les échanges. Un client, un salon privé, un historique consultable.</p>' +
      '<div class="community-tags">' +
      '<span>Ouverture de dossier</span>' +
      '<span>Suivi de projet</span>' +
      '<span>Journal des livraisons</span>' +
      '<span>Support après-vente</span>' +
      '<span>Candidatures</span>' +
      "</div></div>" +
      '<a class="btn btn--discord" href="https://discord.gg/dZDfarP8zT" target="_blank" rel="noopener">Rejoindre le Discord</a>' +
      "</div></div></section>" +
      '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      "<div>" +
      '<a class="brand" href="home.html"><img src="img/logo.png" alt="Logo Roxwood Network">' +
      '<span><span class="brand-name">Roxwood Network</span>' +
      '<span class="brand-sub">Agence digitale</span></span></a>' +
      '<p class="footer-about">Studio web : sites, espaces membres et outils de gestion. Balboa Street, Los Santos, San Andreas.</p>' +
      "</div>" +
      "<div><h4>Entreprise</h4>" +
      '<a href="home.html#expertise">À propos</a>' +
      '<a href="membres.html">Direction</a>' +
      '<a href="https://discord.com/invite/dZDfarP8zT" target="_blank" rel="noopener">Nous trouver</a>' +
      "</div>" +
      "<div><h4>Prestations</h4>" +
      '<a href="services.html">Services</a>' +
      '<a href="services.html#bots">Méthode</a>' +
      '<a href="https://discord.com/invite/dZDfarP8zT" target="_blank" rel="noopener">Demander un devis</a>' +
      "</div>" +
      "<div><h4>Informations</h4>" +
      '<a href="https://discord.com/invite/dZDfarP8zT" target="_blank" rel="noopener">Mentions légales</a>' +
      '<a href="https://discord.gg/dZDfarP8zT" target="_blank" rel="noopener">Discord</a>' +
      '<button class="motion-toggle" type="button" aria-pressed="' + String(!reduced) + '">' +
      '<span class="motion-toggle__dot"></span>Animations activées' +
      "</button>" +
      "</div>" +
      "</div>" +
      '<div class="footer-bottom"><span>&copy; ' + new Date().getFullYear() +
      ' Roxwood Network · Univers Roxwood</span>' +
      '<span>Projet immersif · aucune existence réelle</span></div>' +
      "</div></footer>";

    var toggle = host.querySelector(".motion-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var reducedNow = document.documentElement.classList.toggle("reduce-motion");
        toggle.setAttribute("aria-pressed", String(!reducedNow));
        localStorage.setItem("roxwood-reduce-motion", reducedNow ? "1" : "");
      });
    }
  }

  /* ---------- 2. Révélations au scroll ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = el.getAttribute("data-delay") || 0;
        setTimeout(function () { el.classList.add("is-visible"); }, Number(delay));
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3. Parallax du hero ---------- */
  function initParallax() {
    var bg = document.querySelector(".hero__bg");
    if (!bg) return;
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        bg.style.transform = "translate3d(0," + window.scrollY * 0.28 + "px,0) scale(1.06)";
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- 4. Slider (page preview) ---------- */
  function initSlider() {
    var slider = document.querySelector("[data-slider]");
    if (!slider) return;
    var track = slider.querySelector(".slider__track");
    var slides = track.children.length;
    var dotsHost = slider.querySelector(".slider__dots");
    var index = 0;

    for (var i = 0; i < slides; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Image " + (i + 1));
      (function (n) { b.addEventListener("click", function () { go(n); }); })(i);
      dotsHost.appendChild(b);
    }

    function go(n) {
      index = (n + slides) % slides;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      Array.prototype.forEach.call(dotsHost.children, function (d, k) {
        d.classList.toggle("is-active", k === index);
      });
    }

    slider.querySelector(".slider__nav--prev").addEventListener("click", function () { go(index - 1); });
    slider.querySelector(".slider__nav--next").addEventListener("click", function () { go(index + 1); });
    go(0);
    setInterval(function () { go(index + 1); }, 6500);
  }

  /* ---------- 5. Formulaire de contact (démo) ---------- */
  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = form.querySelector(".alert--ok");
      ok.classList.add("is-visible");
      ok.textContent =
        "Demande transmise. Un chargé de projet Roxwood Network vous recontacte sur Discord sous 24 h.";
      form.reset();
      ok.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ---------- Préférences ---------- */
  function restoreMotionPreference() {
    if (localStorage.getItem("roxwood-reduce-motion") === "1" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("reduce-motion");
    }
  }

  /* ---------- Initialisation ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    restoreMotionPreference();
    initSpaceBackground();
    buildHeader();
    buildFooter();
    initReveal();
    initParallax();
    initSlider();
    initContactForm();
  });
})();
