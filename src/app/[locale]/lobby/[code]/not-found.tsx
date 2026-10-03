import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import LobbyNotFound from '@/components/lobby/LobbyNotFound';

// Affiché par notFound() quand aucun lobby n'a le code demandé.
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
        <LobbyNotFound />
      </main>
      <Footer />
    </>
  );
}
