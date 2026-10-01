// robots.txt (T020) : n'empêche pas l'accès (le proxy s'en charge), évite seulement
// l'indexation de l'écran de connexion — défense en profondeur, principe I.
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/admin" },
  };
}
