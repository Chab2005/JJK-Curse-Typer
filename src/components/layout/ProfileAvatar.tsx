'use client';

import { useTranslations } from 'next-intl';

export default function ProfileAvatar() {
  const t = useTranslations('Header');

  return (
    <img
      alt={t('profileAlt')}
      className="w-8 h-8 rounded-full object-cover ring-1 ring-primary-container/40"
      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwRUKpHIMiAh5rKkR77_VElAQSZAPG_ZqcURZyQLzcziemV5T2nfkw2ZDrdSfzClj_zMPER1rJ1krTt1YQxhiy4BEiQYN3gSjZGddlhHJ5hS883vlqzELsEzoO3ovXuazIyE26QHQbpNPDxpuUNo8kN8fr6KIardUsi3WXsCdeD__gh0bFo3yOOK97XINcrmw1uvwbycdfyVKWQBlEtsPIFa3JZeBL5d5IPUeITrtCRIDp9CkFBIvZ"
    />
  );
}
