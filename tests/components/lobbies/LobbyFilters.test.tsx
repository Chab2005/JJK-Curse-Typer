import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LobbyFilters from '@/components/lobbies/LobbyFilters';
import { DEFAULT_LOBBY_FILTERS, type LobbyFilters as Filters } from '@/components/lobbies/lobbySearch';
import { renderWithIntl } from '../../render';

const FILTERS: Filters = { ...DEFAULT_LOBBY_FILTERS, query: 'maki' };

async function openFilters(filters: Filters = FILTERS) {
  const onChange = vi.fn();
  const view = renderWithIntl(<LobbyFilters filters={filters} onChange={onChange} />);
  await view.user.click(screen.getByRole('button', { name: /^Filters/ }));
  return { ...view, onChange };
}

describe('LobbyFilters (LOB-2)', () => {
  it('checks the boxes that match the current filters', async () => {
    await openFilters({ ...FILTERS, bonusOnly: true, languages: ['en'] });

    expect(screen.getByRole('checkbox', { name: 'Bonuses enabled only' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'English' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'French' })).not.toBeChecked();
  });

  it('turns a toggle on and keeps the rest of the filters', async () => {
    const { user, onChange } = await openFilters();

    await user.click(screen.getByRole('checkbox', { name: 'Bonuses enabled only' }));

    expect(onChange).toHaveBeenCalledWith({ ...FILTERS, bonusOnly: true });
  });

  it('removes an unchecked language and character kind', async () => {
    const { user, onChange } = await openFilters();

    await user.click(screen.getByRole('checkbox', { name: 'French' }));
    await user.click(screen.getByRole('checkbox', { name: 'Digits (0-9)' }));

    expect(onChange).toHaveBeenNthCalledWith(1, { ...FILTERS, languages: ['en'] });
    expect(onChange).toHaveBeenNthCalledWith(2, { ...FILTERS, chars: ['uppercase', 'punctuation', 'accents'] });
  });

  it('counts the active filter groups on the button', () => {
    renderWithIntl(<LobbyFilters filters={{ ...FILTERS, bonusOnly: true, languages: ['fr'] }} onChange={() => {}} />);

    expect(screen.getByRole('button', { name: /^Filters/ })).toContainElement(screen.getByText('2'));
  });

  it('resets every filter but keeps the search text', async () => {
    const { user, onChange } = await openFilters({ ...FILTERS, bonusOnly: true, chars: ['digits'] });

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_LOBBY_FILTERS, query: 'maki' });
  });
});
