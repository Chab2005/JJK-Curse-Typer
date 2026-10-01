export default function Hero() {
  return (
    <section className="flex flex-col items-center text-center max-w-3xl mx-auto">
      <h1
        className="font-display-hero text-headline-lg lg:text-display-hero uppercase tracking-tight text-on-surface"
        style={{ fontFamily: 'var(--font-fondamento), cursive, sans-serif' }}
      >
        Entrer dans le <span className="text-primary tracking-normal">Domaine</span>
      </h1>
      <p className="mt-space-xs font-body-regular text-body-regular text-on-surface-variant max-w-xl">
        Saisissez le sceau secret (Game PIN) de votre escouade ou rejoignez une confrontation publique en cours.
      </p>
    </section>
  );
}
