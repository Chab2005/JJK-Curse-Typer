import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RaceHud from '@/components/race/RaceHud';
import { renderWithIntl } from '../../render';

describe('RaceHud (RACE-9)', () => {
  it('shows the time left of a timed race', () => {
    renderWithIntl(<RaceHud clock="0:42" />);

    expect(screen.getByText('0:42')).toBeInTheDocument();
    expect(screen.getByText('Time left')).toBeInTheDocument();
  });
});
