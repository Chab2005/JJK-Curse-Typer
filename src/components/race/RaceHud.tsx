import { useTranslations } from 'next-intl';

// Temps restant d'une course minutée (RACE-9), dans sa plaque pointée. Le reste se lit sur la piste.
export default function RaceHud({ clock }: { clock: string }) {
  const t = useTranslations('Race.hud');

  return (
    <dl className="flex">
      <div className="hx-cut flex bg-[#8f1022] p-px [--h:14px]">
        <div className="hx-cut flex min-w-24 flex-col-reverse gap-1 bg-linear-to-r from-[#1a0709] to-[#110506] px-[30px] py-2.5 [--h:13.5px]">
          <dt className="font-label-code text-[10px] uppercase tracking-[0.16em] text-outline">{t('remaining')}</dt>
          <dd className="font-grotesk text-[30px] leading-none font-bold tabular-nums text-on-primary-container">{clock}</dd>
        </div>
      </div>
    </dl>
  );
}
