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
  useEffect(() => {
    window.location.replace("/site/index.html");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <a className="text-foreground underline" href="/site/index.html">
        Ouvrir le site Roxwood Network
      </a>
    </div>
  );
}
