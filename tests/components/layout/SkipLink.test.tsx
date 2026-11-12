import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SkipLink from '@/components/layout/SkipLink';
import { renderWithIntl, renderWithLocale } from '../../render';

describe('SkipLink (A11Y-04)', () => {
  it('is the first focusable element and points to the main content', async () => {
    const { user } = renderWithIntl(<><SkipLink /><button type="button">Next</button></>);
    await user.tab();
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('href', '#main');
  });

  it('is translated', () => {
    renderWithLocale(<SkipLink />, 'fr');
    expect(screen.getByRole('link', { name: 'Aller au contenu principal' })).toBeInTheDocument();
  });
});
