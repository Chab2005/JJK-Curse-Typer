import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ClosedLobbyNotice from '@/components/lobbies/ClosedLobbyNotice';
import { renderWithIntl } from '../../render';

describe('ClosedLobbyNotice (COURSE-11)', () => {
  it('tells the visitor the lobby was closed', () => {
    renderWithIntl(<ClosedLobbyNotice />);
    expect(screen.getByRole('status')).toHaveTextContent('The lobby was closed.');
  });
});
