import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ResultsHostControls from '@/components/race/ResultsHostControls';
import { renderWithIntl } from '../../render';

const handlers = () => ({ onRestart: vi.fn(), onClose: vi.fn(), onLeave: vi.fn() });

describe('ResultsHostControls (COURSE-11)', () => {
  it('offers the host to restart the race or close the lobby', async () => {
    const on = handlers();
    const { user } = renderWithIntl(<ResultsHostControls isHost {...on} />);

    expect(screen.getByText('Waiting for the host to restart the race or close the lobby…').closest('[aria-hidden]')).toHaveClass('invisible');
    await user.click(screen.getByRole('button', { name: 'Restart the race' }));
    expect(on.onRestart).toHaveBeenCalledTimes(1);
  });

  it('asks the host to confirm before closing the lobby', async () => {
    const on = handlers();
    const { user } = renderWithIntl(<ResultsHostControls isHost {...on} />);

    await user.click(screen.getByRole('button', { name: 'Close the lobby' }));
    const dialog = screen.getByRole('dialog', { name: 'Close the lobby?' });
    expect(dialog).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep it open' }));
    expect(on.onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Close the lobby' }));
    const confirm = screen.getAllByRole('button', { name: 'Close the lobby' }).at(-1)!;
    await user.click(confirm);
    expect(on.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the others a waiting line and a way out, without the host buttons', async () => {
    const on = handlers();
    const { user } = renderWithIntl(<ResultsHostControls isHost={false} {...on} />);

    expect(screen.getByRole('status')).toHaveTextContent('Waiting for the host to restart the race or close the lobby…');
    expect(screen.queryByRole('button', { name: 'Restart the race' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close the lobby' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Leave the lobby' }));
    expect(on.onLeave).toHaveBeenCalledTimes(1);
  });

  it('keeps both variants in the same box so nothing moves when the host changes', () => {
    const on = handlers();
    const { container } = renderWithIntl(<ResultsHostControls isHost {...on} />);
    // Reserve stacks the host buttons and the waiting line in one grid cell (AGENTS.md: no layout shift).
    expect(container.querySelectorAll('.col-start-1.row-start-1')).toHaveLength(2);
  });
});
