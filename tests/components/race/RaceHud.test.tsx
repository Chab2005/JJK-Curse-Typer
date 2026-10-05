import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RaceHud from '@/components/race/RaceHud';
import { renderWithIntl } from '../../render';

describe('RaceHud (RACE-6)', () => {
  it('shows live WPM, accuracy, position and time', () => {
    renderWithIntl(<RaceHud wpm={72} accuracy={0.968} rank={2} total={8} clock="0:42" clockLabel="elapsed" onAbandon={null} />);

    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText('97%')).toBeInTheDocument();
    expect(screen.getByText('2/8')).toBeInTheDocument();
    expect(screen.getByText('0:42')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Abandon' })).not.toBeInTheDocument();
  });

  it('lets the player abandon (RACE-10)', async () => {
    const onAbandon = vi.fn();
    const { user } = renderWithIntl(<RaceHud wpm={0} accuracy={1} rank={null} total={8} clock="1:00" clockLabel="remaining" onAbandon={onAbandon} />);

    expect(screen.getByText('Time left')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Abandon' }));
    expect(onAbandon).toHaveBeenCalled();
  });
});
