import BevelFrame, { cardFrame } from '@/components/shared/BevelFrame';

// Cadre des pages de connexion et d'inscription : même carte biseautée que « Entrer dans le domaine ».
export default function AuthCard({ eyebrow, title, intro, children, footer }: { eyebrow: string; title: string; intro?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="relative flex w-full flex-1 items-start justify-center overflow-hidden bg-surface px-6 pt-14 pb-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_45%_70%_at_25%_0%,rgb(49_49_192/0.35),transparent_70%),radial-gradient(ellipse_40%_60%_at_80%_0%,rgb(147_0_10/0.35),transparent_70%)]" />
      <div className="relative w-full max-w-[460px]">
        <BevelFrame frame={cardFrame} className="flex flex-col gap-[22px] bg-surface-container-low px-[34px] pt-9 pb-[30px]">
          <header className="flex flex-col gap-2">
            <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{eyebrow}</p>
            <h1 className="text-[28px] uppercase tracking-[0.12em]">{title}</h1>
            {intro && <p className="text-[15px] text-on-surface-variant">{intro}</p>}
          </header>
          {children}
        </BevelFrame>
        {footer && <p className="mt-6 text-center text-[15px] text-on-surface-variant">{footer}</p>}
      </div>
    </main>
  );
}
