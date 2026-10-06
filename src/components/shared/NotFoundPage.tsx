import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import NotFound, { type NotFoundVariant } from './NotFound';

// Page complète rendue par les fichiers not-found.tsx : en-tête, message 404 et pied de page.
export default function NotFoundPage({ variant }: { variant: NotFoundVariant }) {
  return (
    <>
      <SiteHeader />
      <main className="relative w-full flex-1 overflow-hidden bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
        <NotFound variant={variant} />
      </main>
      <Footer />
    </>
  );
}
