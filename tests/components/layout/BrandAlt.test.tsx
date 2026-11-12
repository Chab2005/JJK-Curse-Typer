import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Brand from '@/components/layout/Brand';
import Footer from '@/components/layout/Footer';
import { renderWithLocale } from '../../render';

describe('logo alt text (I18N-01)', () => {
  it.each([
    ['en', 'Jujutsu Kaisen logo'],
    ['fr', 'Logo Jujutsu Kaisen'],
  ] as const)('is translated in %s', (locale, alt) => {
    renderWithLocale(<><Brand /><Footer /></>, locale);
    expect(screen.getAllByAltText(alt)).toHaveLength(2);
  });
});
