import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { findSampleProfile } from '@/components/profile/sampleProfiles';
import StatTiles from '@/components/profile/StatTiles';
import { renderWithIntl } from '../../render';

describe('StatTiles (smoke)', () => {
  it('renders the four main statistics', () => {
    const profile = findSampleProfile('Satoru_Infinity', new Date('2026-10-03T12:00:00Z'))!;
    renderWithIntl(<StatTiles profile={profile} />);

    expect(screen.getByRole('region', { name: 'Main statistics' })).toBeInTheDocument();
    expect(screen.getAllByRole('term')).toHaveLength(4);
    expect(screen.getByText('99.1%')).toBeInTheDocument();
  });

  it('shows the most played character next to the tiles when there is one', () => {
    const profile = findSampleProfile('Satoru_Infinity', new Date('2026-10-03T12:00:00Z'))!;
    renderWithIntl(<StatTiles profile={profile} mostPlayed={{ character: 'gojo', games: 94, wins: 20 }} />);

    expect(screen.getByRole('heading', { name: 'Satoru Gojo' })).toBeInTheDocument();
    expect(screen.getAllByRole('term')).toHaveLength(4);
  });
});
