import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InviteCard from '@/components/lobby/InviteCard';
import { renderWithIntl } from '../../render';

describe('InviteCard (LOB-3, LOB-4)', () => {
  it('copies the lobby code', async () => {
    const { user } = renderWithIntl(<InviteCard code="SHJ-60S" />);

    await user.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(await navigator.clipboard.readText()).toBe('SHJ-60S');
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('copies the invite link without the query string', async () => {
    window.history.replaceState(null, '', '/fr/lobby/SHJ-60S?spectate=1');
    const { user } = renderWithIntl(<InviteCard code="SHJ-60S" />);

    await user.click(screen.getByRole('button', { name: 'Copy invite link' }));

    expect(await navigator.clipboard.readText()).toBe(`${window.location.origin}/fr/lobby/SHJ-60S`);
  });
});
