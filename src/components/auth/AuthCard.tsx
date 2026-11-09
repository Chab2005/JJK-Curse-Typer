import BevelPanel from '@/components/shared/BevelPanel';

// Cadre des pages de connexion et d'inscription (canvas « Connexion · refonte cramoisie ») : une seule carte cramoisie, centrée.
export default function AuthCard({ eyebrow, title, intro, children, footer }: { eyebrow: string; title: string; intro?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main id="main" className="relative flex w-full flex-1 items-start justify-center overflow-hidden bg-surface px-6 pt-14 pb-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_70%_at_35%_0%,rgb(147_0_10/0.4),transparent_70%)]" />
      <div className="relative w-full max-w-[512px] drop-shadow-[0_24px_40px_rgb(0_0_0/0.5)]">
        <BevelPanel className="flex flex-col gap-[18px] px-[34px] pt-9 pb-9">
          <header className="flex flex-col gap-2">
            <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-text">{eyebrow}</p>
            <h1 className="text-[34px] leading-[1.15] uppercase tracking-[0.1em] text-on-primary-container">{title}</h1>
            {intro && <p className="text-[17px] leading-[25px] text-on-surface-variant">{intro}</p>}
          </header>
          {children}
          {footer && <p className="text-center text-[16px] text-on-surface-variant">{footer}</p>}
        </BevelPanel>
      </div>
    </main>
  );
}
