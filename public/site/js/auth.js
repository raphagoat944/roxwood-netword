/* ==========================================================================
   Roxwood Network — Espace membre (logique de démonstration)
   Session stockée côté navigateur : aucune donnée réelle n'est transmise.
   ========================================================================== */

(function () {
  "use strict";

  var KEY = "roxwood_session";

  // Comptes de démonstration.
  var ACCOUNTS = [
    { id: "poulpizar", pass: "roxwood2025", name: "Poulpizar", role: "Directeur technique" },
    { id: "invite", pass: "demo", name: "Invité", role: "Accès lecture" }
  ];

  function saveSession(user) {
    sessionStorage.setItem(KEY, JSON.stringify({ name: user.name, role: user.role, at: Date.now() }));
  }

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; }
  }

  /* ---------- Page de connexion ---------- */
  function initLogin() {
    var form = document.querySelector("[data-login-form]");
    if (!form) return;
    var err = form.querySelector(".alert--error");
    var ok = form.querySelector(".alert--ok");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var id = form.identifiant.value.trim().toLowerCase();
      var pass = form.motdepasse.value;
      var user = ACCOUNTS.filter(function (a) { return a.id === id && a.pass === pass; })[0];

      err.classList.remove("is-visible");
      if (!user) {
        err.textContent = "Identifiants refusés par le bot Roxwood. Vérifiez vos accès.";
        err.classList.add("is-visible");
        return;
      }
      saveSession(user);
      ok.textContent = "Authentification validée — ouverture du tableau de bord…";
      ok.classList.add("is-visible");
      setTimeout(function () { window.location.href = "dashboard.html"; }, 900);
    });
  }

  /* ---------- Tableau de bord protégé ---------- */
  function initDashboard() {
    var root = document.querySelector("[data-dashboard]");
    if (!root) return;
    var session = getSession();
    if (!session) { window.location.replace("membres.html"); return; }

    var nameEl = root.querySelector("[data-user-name]");
    var roleEl = root.querySelector("[data-user-role]");
    if (nameEl) nameEl.textContent = session.name;
    if (roleEl) roleEl.textContent = session.role;

    var out = root.querySelector("[data-logout]");
    if (out) {
      out.addEventListener("click", function () {
        sessionStorage.removeItem(KEY);
        window.location.href = "membres.html";
      });
    }

    var create = root.querySelector("[data-refresh]");
    if (create) {
      create.addEventListener("click", function () {
        var alertBox = root.querySelector(".alert--ok");
        alertBox.textContent =
          "Flux synchronisé — dernières candidatures, commandes et journaux récupérés depuis le bot.";
        alertBox.classList.add("is-visible");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLogin();
    initDashboard();
  });
})();
