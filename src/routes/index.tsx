import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

// Le site Roxwood Network est un site statique HTML/CSS/JS servi depuis /site.
// La racine redirige simplement vers sa page d'accueil.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roxwood Network — Agence Digitale" },
      {
        name: "description",
        content:
          "Roxwood Network conçoit des sites et portails immersifs pour entreprises, agences et organisations.",
      },
      { property: "og:title", content: "Roxwood Network — Agence Digitale" },
      {
        property: "og:description",
        content:
          "Sites vitrines, portails internes et interfaces sécurisées, conçus sur mesure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Roxwood Network</h1>
      <p className="max-w-md text-muted-foreground">
        Les fichiers du site (index.html, css, js, img, models) sont à la racine
        du projet, prêts pour GitHub Pages.
      </p>
    </div>
  );
}
