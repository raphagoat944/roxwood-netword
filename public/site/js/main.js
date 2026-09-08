/* ==========================================================================
   Roxwood Network — Script commun
   1. Header / footer partagés  2. Menu mobile  3. Révélations au scroll
   4. Parallax du hero          5. Slider de preview
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- 1. Header & footer communs ---------- */
  var PAGES = [
    { href: "index.html", label: "Accueil" },
    { href: "services.html", label: "Services" },
    { href: "portfolio.html", label: "Portfolio" },
    { href: "membres.html", label: "Espace Membre" },
    { href: "contact.html", label: "Contact" }
  ];

  function currentPage() {
    var file = window.location.pathname.split("/").pop();
    return file === "" ? "index.html" : file;
  }

  function buildHeader() {
    var host = document.querySelector("[data-header]");
    if (!host) return;
    var active = currentPage();
    // Les sous-pages restent rattachées à leur rubrique parente.
    if (active === "dashboard.html") active = "membres.html";

    var links = PAGES.map(function (p) {
      var cls = p.href === active ? ' class="is-active"' : "";
      return '<a href="' + p.href + '"' + cls + ">" + p.label + "</a>";
    }).join("");

    host.innerHTML =
      '<header class="site-header">' +
      '<div class="container nav">' +
      '<a class="brand" href="index.html">' +
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
    host.innerHTML =
      '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      "<div>" +
      '<a class="brand" href="index.html"><img src="img/logo.png" alt="Logo Roxwood Network">' +
      '<span><span class="brand-name">Roxwood Network</span>' +
      '<span class="brand-sub">Agence digitale</span></span></a>' +
      '<p style="color:var(--grey);font-size:.9rem;margin-top:1rem;max-width:34ch">' +
      "Conception de sites et portails immersifs pour les entreprises, agences et organisations de la ville.</p>" +
      "</div>" +
      "<div><h4>Navigation</h4>" +
      PAGES.map(function (p) { return '<a href="' + p.href + '">' + p.label + "</a>"; }).join("") +
      "</div>" +
      "<div><h4>Services</h4>" +
      '<a href="services.html#vitrines">Sites vitrines</a>' +
      '<a href="services.html#portails">Portails internes</a>' +
      '<a href="services.html#bots">Intégration bots / API</a>' +
      '<a href="services.html#clandestin">Systèmes sécurisés</a>' +
      "</div>" +
      "<div><h4>Contact</h4>" +
      '<a href="mailto:contact@roxwood-network.rp">contact@roxwood-network.rp</a>' +
      "<a href=\"contact.html\">Discord : RoxwoodNetwork#0001</a>" +
      '<a href="https://github.com/poulpizar01/roxwood-network-entreprise" target="_blank" rel="noopener">Notre bot Discord</a>' +
      "</div>" +
      "</div>" +
      '<div class="footer-bottom"><span>&copy; ' + new Date().getFullYear() +
      " Roxwood Network. Tous droits réservés.</span>" +
      "<span>Studio digital &mdash; conception, hébergement, maintenance</span></div>" +
      "</div></footer>";
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

  /* ---------- Initialisation ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildHeader();
    buildFooter();
    initReveal();
    initParallax();
    initSlider();
    initContactForm();
  });
})();
