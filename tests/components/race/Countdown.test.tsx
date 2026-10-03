import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Countdown from '@/components/race/Countdown';
import { renderWithIntl } from '../../render';

describe('Countdown (RACE-1)', () => {
  it('shows the seconds left, then the start signal', () => {
    const { rerender } = renderWithIntl(<Countdown seconds={2} />);
    expect(screen.getByRole('status', { name: 'Countdown' })).toHaveTextContent('2');

    rerender(<Countdown seconds={0} />);
    expect(screen.getByRole('status', { name: 'Countdown' })).toHaveTextContent('Go!');
  });
});
