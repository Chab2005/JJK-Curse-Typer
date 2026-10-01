'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const t = useTranslations('Header');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
      <div className="h-20 w-full px-space-lg lg:px-margin flex items-center justify-between gap-space-md">
        {/* Logo */}
        <div className="flex items-center gap-space-md shrink-0">
          <Link
            href="#"
            className="flex items-center gap-space-sm group"
          >
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface group-hover:text-primary transition-colors">
                JJK : <span className="text-primary">Curse Typer</span>
              </span>
              <span className="font-talisman-tag text-talisman-tag uppercase tracking-widest text-primary-container">
                <br />
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-space-lg">
          <NavLink href="#" label={t('nav.join')} active />
          <NavLink href="#" label={t('nav.multiplayer')} />
          <NavLink href="#" label={t('nav.leaderboard')} />
          <NavLink href="#" label={t('nav.archives')} />
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-space-md shrink-0">
          {/* Stats Display */}
          <div className="hidden 2xl:flex items-center gap-space-md px-space-md py-space-xs bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-label-code text-primary">142</span>
              <span className="font-label-code text-talisman-tag uppercase text-on-surface-variant">{t('stats.wpmRecord')}</span>
            </div>
            <div className="w-px h-3 bg-surface-container-highest"></div>
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-label-code text-tertiary">99.4%</span>
              <span className="font-label-code text-talisman-tag uppercase text-on-surface-variant">{t('stats.accuracy')}</span>
            </div>
            <div className="w-px h-3 bg-surface-container-highest"></div>
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-label-code text-secondary">Satoru</span>
              <span className="font-talisman-tag text-talisman-tag text-outline">五条</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-space-sm">
            <LanguageSwitcher />

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={t('soundEffects')}
              className="px-space-sm py-space-xs rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-space-xs font-label-code text-label-code"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              title={t('theme')}
              className="px-space-sm py-space-xs rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-space-xs font-label-code text-label-code"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
              </svg>
              <span className="hidden md:inline font-talisman-tag text-talisman-tag uppercase">Sukuna</span>
            </button>

            {/* Profile */}
            <div className="relative flex items-center ml-space-xs pl-space-sm">
              <img
                alt={t('profileAlt')}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-primary-container/40"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwRUKpHIMiAh5rKkR77_VElAQSZAPG_ZqcURZyQLzcziemV5T2nfkw2ZDrdSfzClj_zMPER1rJ1krTt1YQxhiy4BEiQYN3gSjZGddlhHJ5hS883vlqzELsEzoO3ovXuazIyE26QHQbpNPDxpuUNo8kN8fr6KIardUsi3WXsCdeD__gh0bFo3yOOK97XINcrmw1uvwbycdfyVKWQBlEtsPIFa3JZeBL5d5IPUeITrtCRIDp9CkFBIvZ"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center py-space-xs transition-colors ${
        active
          ? 'text-primary font-bold border-b border-primary-container'
          : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      <span className="font-headline-sm text-label-code uppercase tracking-wider">{label}</span>
    </Link>
  );
}
