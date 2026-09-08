/* ==========================================================================
   Roxwood Network — Script commun
   1. Header / footer partagés  2. Menu mobile  3. Révélations au scroll
   4. Parallax du hero          5. Slider de preview
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- 1. Header & footer communs ---------- */
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
    if (localStorage.getItem("roxwood-reduce-motion") === "1") {
      document.documentElement.classList.add("reduce-motion");
    }
  }

  /* ---------- Initialisation ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    restoreMotionPreference();
    buildHeader();
    buildFooter();
    initReveal();
    initParallax();
    initSlider();
    initContactForm();
  });
})();
