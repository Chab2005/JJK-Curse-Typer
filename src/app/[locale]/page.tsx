import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Characters from "@/components/home/Characters";
import GameSystem from "@/components/home/GameSystem";
import Hero from "@/components/home/Hero";
import JoinSection from "@/components/home/JoinSection";
import TopExorcists from "@/components/home/TopExorcists";
import type { Locale } from "@/i18n/config";
import { listPublicLobbies } from "@/lib/lobbies";
import { setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

// Valeur de démonstration en attendant la room d'index des lobbies (LOB-2).
const ONLINE_EXORCISTS = 342;

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  // Les lobbies créés vivent en mémoire : la page se rend à chaque requête.
  await connection();

  return (
    <>
      <Header />
      <main className="w-full flex-1 bg-surface-container-lowest">
        <Hero onlineCount={ONLINE_EXORCISTS} />
        <JoinSection publicLobbies={listPublicLobbies()} />
        <GameSystem />
        <Characters />
        <TopExorcists />
      </main>
      <Footer />
    </>
  );
}
