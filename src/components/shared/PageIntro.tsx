// En-tête des pages intérieures : sur-titre, titre, phrase d'intro et filigrane en contour.
export default function PageIntro({ id, eyebrow, title, intro, watermark }: { id: string; eyebrow: string; title: React.ReactNode; intro?: React.ReactNode; watermark: string }) {
  return (
    <div className="relative flex flex-col gap-2">
      <p aria-hidden="true" className="text-stroke-ghost pointer-events-none absolute -top-10 -left-3 hidden whitespace-nowrap text-[160px] uppercase leading-none lg:block">
        {watermark}
      </p>
      <p className="font-label-code relative text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{eyebrow}</p>
      <h1 id={id} className="relative text-[clamp(34px,4.5vw,56px)] leading-tight uppercase tracking-[0.08em]">{title}</h1>
      {intro && <p className="relative max-w-[640px] text-lg leading-7 text-on-surface-variant">{intro}</p>}
    </div>
  );
}
