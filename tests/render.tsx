import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import en from '../messages/en.json';

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
