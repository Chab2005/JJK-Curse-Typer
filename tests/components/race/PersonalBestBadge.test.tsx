import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PersonalBestBadge from '@/components/race/PersonalBestBadge';
import { renderWithIntl } from '../../render';

describe('PersonalBestBadge (RES-04)', () => {
  it('says the player beat their personal best', () => {
    renderWithIntl(<PersonalBestBadge shown />);
    expect(screen.getByTestId('record-badge')).toHaveTextContent('Personal best');
    expect(screen.getByTestId('record-badge')).not.toHaveClass('invisible');
  });

  it('keeps its place, hidden, before a record is known', () => {
    renderWithIntl(<PersonalBestBadge shown={false} />);
    const badge = screen.getByTestId('record-badge');
    expect(badge).toHaveClass('invisible');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
  });
});
