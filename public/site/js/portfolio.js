/* ==========================================================================
   Roxwood Network — Portfolio interactif
   Données des réalisations + grille + modale de preview cliquable.
   ========================================================================== */

/* Données partagées avec portfolio-preview.html */
var ROXWOOD_PROJECTS = [
  {
    id: "dynasty8",
    name: "Dynasty 8",
    type: "Agence immobilière de Los Santos",
    category: "Entreprise",
    accent: "cyan",
    url: "http://51.255.173.188/accueil.html",
    desc: "Vitrine immobilière complète : catalogue de biens, webmap des adresses référencées, offres VIP et espace réservé aux agents de l'agence.",
    highlights: ["Catalogue de biens filtrable", "Webmap des adresses", "Espace agents protégé"],
    shots: ["img/dynasty8-1.jpg", "img/dynasty8-2.jpg", "img/dynasty8-3.jpg"]
  },
  {
    id: "marlowe",
    name: "Marlowe Vineyard",
    type: "Domaine viticole",
    category: "Entreprise",
    accent: "cyan",
    url: "https://poulpizar01.github.io/Marlowe-Vineyard/index.html",
    desc: "Identité chaleureuse pour un domaine familial : présentation des cuvées, visite du domaine et demandes de privatisation ou de dégustation.",
    highlights: ["Présentation des cuvées", "Galerie du domaine", "Formulaire d'événement"],
    shots: ["img/marlowe-1.jpg", "img/marlowe-2.jpg", "img/marlowe-3.jpg"]
  },
  {
    id: "lamaja13",
    name: "La Maja 13",
    type: "Groupe Particulier",
    category: "Particulier",
    accent: "magenta",
    url: "https://lamaja13.duckdns.org/",
    desc: "Interface discrète pour une organisation qui tient à sa confidentialité : navigation minimale, ambiance nocturne et sections réservées aux membres reconnus.",
    highlights: ["Accès filtré", "Pages non listées", "Design volontairement sombre"],
    shots: ["img/lamaja13-1.jpg", "img/lamaja13-2.jpg", "img/lamaja13-3.jpg"]
  }
];

(function () {
  "use strict";

  var grid = document.querySelector("[data-portfolio-grid]");
  if (!grid) return;

  /* ---------- 1. Construction de la grille ---------- */
  grid.innerHTML = ROXWOOD_PROJECTS.map(function (p, i) {
    var tagCls = p.accent === "magenta" ? "tag tag--magenta" : "tag";
    return (
      '<article class="card project reveal' + (p.accent === "magenta" ? " card--magenta" : "") +
      '" data-delay="' + i * 120 + '">' +
        '<div class="project__media">' +
          '<span class="' + tagCls + ' project__badge">' + p.category + "</span>" +
          '<img src="' + p.shots[0] + '" alt="Aperçu du site ' + p.name + '" loading="lazy">' +
        "</div>" +
        '<div class="project__body">' +
          "<h3>" + p.name + "</h3>" +
          '<p style="color:var(--cyan);font-size:.82rem;letter-spacing:.1em;text-transform:uppercase">' + p.type + "</p>" +
          "<p>" + p.desc + "</p>" +
          '<div class="project__actions">' +
            '<button class="btn btn--primary" type="button" data-open-preview="' + p.id + '">Voir la preview</button>' +
            '<a class="btn btn--ghost" href="' + p.url + '" target="_blank" rel="noopener">Explorer le site</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }).join("");

  /* ---------- 2. Modale de preview ---------- */
  var modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML =
    '<div class="modal__box">' +
      '<div class="modal__head">' +
        "<div><span class=\"tag\" data-m-cat></span>" +
        '<h2 style="margin-top:.6rem" data-m-name></h2>' +
        '<p style="color:var(--grey);font-size:.95rem" data-m-type></p></div>' +
        '<button class="modal__close" type="button" aria-label="Fermer la preview">&times;</button>' +
      "</div>" +
      '<div class="browser">' +
        '<div class="browser__bar">' +
          '<span class="browser__dots"><i></i><i></i><i></i></span>' +
          '<span class="browser__url" data-m-url></span>' +
          '<span class="browser__open">Cliquez sur l\'aperçu pour ouvrir le site &#8599;</span>' +
        "</div>" +
        '<a class="shot" target="_blank" rel="noopener" data-m-link>' +
          '<img alt="" data-m-shot>' +
          '<span class="shot__hint"><span>Ouvrir le site dans un nouvel onglet</span></span>' +
        "</a>" +
      "</div>" +
      '<div class="modal__thumbs" data-m-thumbs></div>' +
      '<div class="panel" style="margin-top:1.2rem">' +
        '<p data-m-desc style="color:var(--grey)"></p>' +
        '<ul class="feature-list" style="margin-top:1.2rem" data-m-highlights></ul>' +
        '<a class="btn btn--primary btn--block" style="margin-top:1.4rem" target="_blank" rel="noopener" data-m-cta>Explorer le site</a>' +
      "</div>" +
    "</div>";
  document.body.appendChild(modal);

  var q = function (sel) { return modal.querySelector(sel); };

  function openPreview(id) {
    var p = ROXWOOD_PROJECTS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;

    q("[data-m-cat]").textContent = p.category;
    q("[data-m-cat]").className = p.accent === "magenta" ? "tag tag--magenta" : "tag";
    q("[data-m-name]").textContent = p.name;
    q("[data-m-type]").textContent = p.type;
    q("[data-m-url]").textContent = p.url;
    q("[data-m-desc]").textContent = p.desc;
    q("[data-m-link]").href = p.url;
    q("[data-m-cta]").href = p.url;
    q("[data-m-shot]").src = p.shots[0];
    q("[data-m-shot]").alt = "Aperçu du site " + p.name;

    q("[data-m-highlights]").innerHTML = p.highlights.map(function (h) {
      return '<li><i class="dot"></i><div><b>' + h + "</b></div></li>";
    }).join("");

    var thumbs = q("[data-m-thumbs]");
    thumbs.innerHTML = p.shots.map(function (s, i) {
      return '<img src="' + s + '" alt="Vue ' + (i + 1) + ' de ' + p.name + '"' +
        (i === 0 ? ' class="is-active"' : "") + ">";
    }).join("");
    Array.prototype.forEach.call(thumbs.children, function (t) {
      t.addEventListener("click", function () {
        q("[data-m-shot]").src = t.src;
        Array.prototype.forEach.call(thumbs.children, function (o) { o.classList.remove("is-active"); });
        t.classList.add("is-active");
      });
    });

    modal.classList.add("is-open");
    document.body.classList.add("no-scroll");
  }

  function closePreview() {
    modal.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
  }

  q(".modal__close").addEventListener("click", closePreview);
  modal.addEventListener("click", function (e) { if (e.target === modal) closePreview(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePreview(); });

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-open-preview]");
    if (btn) openPreview(btn.getAttribute("data-open-preview"));
  });

  /* Ouverture directe via ?p=dynasty8 (liens depuis l'accueil). */
  var direct = new URLSearchParams(window.location.search).get("p");
  if (direct) openPreview(direct);
})();
