import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ErrorPage from '@/components/shared/ErrorPage';
import { renderWithIntl, renderWithLocale } from '../../render';

describe('ErrorPage (I18N-01)', () => {
  it('shows the translated message and retries on click', async () => {
    const reset = vi.fn();
    const { user } = renderWithIntl(<ErrorPage reset={reset} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('is translated in French', () => {
    renderWithLocale(<ErrorPage reset={() => {}} />, 'fr');
    expect(screen.getByRole('heading', { level: 1, name: 'Un problème est survenu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });
});
