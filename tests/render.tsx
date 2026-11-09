import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import en from '../messages/en.json';
import fr from '../messages/fr.json';

// Renders a component with the real English messages, like the app does under /en.
export function renderWithIntl(ui: ReactElement, options?: RenderOptions) {
  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }) => (
        <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
          {children}
        </NextIntlClientProvider>
      ),
      ...options,
    }),
  };
}

// Same, in French: for checks on localized output (alt texts, number formats).
export function renderWithLocale(ui: ReactElement, locale: 'en' | 'fr', options?: RenderOptions) {
  const messages = locale === 'fr' ? fr : en;
  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }) => (
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
          {children}
        </NextIntlClientProvider>
      ),
      ...options,
    }),
  };
}
