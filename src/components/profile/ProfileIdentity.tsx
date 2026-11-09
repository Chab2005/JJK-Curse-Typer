import { useTranslations } from 'next-intl';
import Avatar from '@/components/shared/Avatar';
import { Chevrons } from '@/components/shared/ChevronButton';
import Pointer from '@/components/shared/Pointer';
import type { CharacterId } from '@/components/shared/characters';

// Haut du profil : avatar dans un cadre cramoisi, pseudo en filigrane, sur-titre, nom, puis `children` (liens, statut)
// et le résumé des courses. `action` : bouton à droite (modifier le profil, paramètres du compte).
export default function ProfileIdentity({
  name,
  avatar,
  photo = null,
  summary,
  action,
  children,
}: {
  name: string;
  avatar: CharacterId | null;
  photo?: string | null;
  summary: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = useTranslations('Profile');

  return (
    <section aria-labelledby="profile-title" className="relative flex flex-wrap items-center gap-x-9 gap-y-6">
      <p aria-hidden="true" className="text-stroke-ghost pointer-events-none absolute -top-12 right-0 hidden whitespace-nowrap text-[150px] leading-none uppercase lg:block">
        {name.split(/[_\s]/)[0]}
      </p>

      <span className="relative inline-flex shrink-0 drop-shadow-[0_0_18px_rgb(225_29_72/0.35)]">
        <span className="bevel inline-flex bg-primary-container p-0.5">
          <span className="bevel inline-flex bg-surface-container-lowest p-[3px]">
            <Avatar avatar={avatar} name={name} src={photo} size={132} shape="bevel" />
          </span>
        </span>
      </span>

      <div className="relative flex min-w-0 flex-1 basis-80 flex-col gap-2.5">
        <p className="font-label-code flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.32em] text-primary-text">
          <span aria-hidden="true" className="flex h-[22px] w-3 -scale-x-100">
            <Chevrons order="decreasing" className="size-full" />
          </span>
          {t('eyebrow')}
        </p>
        <h1 id="profile-title" className="font-grotesk text-[clamp(34px,4.5vw,52px)] leading-[1.1] font-semibold text-on-primary-container [overflow-wrap:anywhere]">
          {name}
        </h1>
        {children}
        <p className="font-label-code flex items-center gap-2.5 text-[12px] uppercase tracking-[0.14em] text-outline">
          <Pointer className="text-tertiary" />
          {summary}
        </p>
      </div>

      {action && <div className="relative shrink-0">{action}</div>}
    </section>
  );
}
