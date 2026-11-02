import type { ComponentProps, ReactNode } from 'react';

// Champ texte à bouts pointus des paramètres (canvas « Paramètres · style cramoisi ») : un filet cramoisi qui s'allume au focus
// et pâlit sur une erreur (`aria-invalid`), autour d'une face sombre. `icon` : pictogramme à gauche (GitHub, Discord).
export default function HexInput({ icon, large = false, className = '', ...props }: { icon?: ReactNode; large?: boolean } & ComponentProps<'input'>) {
  return (
    <span className="group hx-cut relative flex bg-[#8f1022] p-px transition-colors [--h:16px] focus-within:bg-primary-container has-aria-invalid:bg-error">
      {icon && <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-[26px] z-10 flex -translate-y-1/2 text-outline">{icon}</span>}
      <input
        {...props}
        className={`hx-cut w-full bg-[radial-gradient(120%_160%_at_50%_0%,#2a0b10_0%,#170608_55%,#0c0304_100%)] text-on-primary-container [--h:15.5px] placeholder:text-[#7d6162] focus:outline-none ${large ? 'font-grotesk h-[52px] px-8 text-xl' : 'font-label-code h-[46px] text-[15px]'} ${icon ? 'pr-6 pl-[54px]' : large ? '' : 'px-6'} ${className}`}
      />
    </span>
  );
}
