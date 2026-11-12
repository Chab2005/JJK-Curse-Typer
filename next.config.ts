import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  // En dev, Next ne sert ses scripts qu'à `localhost` : ouverte par http://127.0.0.1:3000, la page s'affiche sans
  // JavaScript et aucun bouton ne répond (créer un lobby, entre autres). Sans effet en production.
  allowedDevOrigins: ["127.0.0.1"],
};

export default withNextIntl(nextConfig);
