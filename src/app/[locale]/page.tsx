import Footer from "@/components/layout/Footer";
import { getSessionUser } from "@/lib/auth/session";
import SiteHeader from "@/components/layout/SiteHeader";
import Characters from "@/components/home/Characters";
import GameSystem from "@/components/home/GameSystem";
import Hero from "@/components/home/Hero";
import JoinSection from "@/components/home/JoinSection";
import TopExorcists from "@/components/home/TopExorcists";
import type { Locale } from "@/i18n/config";
import { rankPlayers } from "@/components/leaderboard/leaderboard";
import { listPublicLobbies } from "@/lib/lobbies";
import { showSampleData } from "@/lib/sampleData";
import { leaderboardPlayers } from "@/lib/stats";
import { setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

// Joueurs affichés dans le top de l'accueil (STAT-8).
const TOP_COUNT = 5;

// Valeur de démonstration en attendant la room d'index des lobbies (LOB-2).
const ONLINE_EXORCISTS = 342;

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  // Les lobbies créés vivent en mémoire : la page se rend à chaque requête.
  await connection();
  const user = await getSessionUser();
  // Même classement que /leaderboard (catégorie MPM par défaut), limité aux premiers.
  const top = rankPlayers(await leaderboardPlayers(), "wpm").slice(0, TOP_COUNT);

  return (
    <>
      <SiteHeader />
      <main id="main" className="w-full flex-1 bg-surface-container-lowest">
        <Hero onlineCount={showSampleData() ? ONLINE_EXORCISTS : null} />
        <JoinSection showSamples={showSampleData()} publicLobbies={listPublicLobbies()} accountName={user?.displayName ?? null} />
        <GameSystem />
        <Characters />
        <TopExorcists players={top} />
      </main>
      <Footer />
    </>
  );
}
