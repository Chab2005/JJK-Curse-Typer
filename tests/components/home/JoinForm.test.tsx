import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JoinForm from '@/components/home/JoinForm';
import { renderWithIntl } from '../../render';

describe('JoinForm', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('shows the syncing banner with the upper-cased PIN until the simulated connection ends', async () => {
    const { user } = renderWithIntl(<JoinForm />);
    await user.type(screen.getByLabelText(/PIN/), 'abc-123');

    await user.click(screen.getByRole('button', { name: 'Expand the domain' }));

    expect(screen.getByRole('status')).toHaveTextContent('Syncing the occult barriers... Domain: ABC-123');
    expect(screen.getByRole('button', { name: 'Expand the domain' })).toBeDisabled();

    act(() => vi.advanceTimersByTime(2400));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand the domain' })).toBeEnabled();
  });

  it('falls back to the demo PIN when none is typed', async () => {
    const { user } = renderWithIntl(<JoinForm />);

    await user.click(screen.getByRole('button', { name: 'Expand the domain' }));

    expect(screen.getByRole('status')).toHaveTextContent('884-JJK');
  });

  it('caps the PIN at 7 characters', async () => {
    const { user } = renderWithIntl(<JoinForm />);
    const pin = screen.getByLabelText(/PIN/);

    await user.type(pin, '123-4567');

    expect(pin).toHaveValue('123-456');
  });

  it('draws another exorcist name with the random button', async () => {
    const { user } = renderWithIntl(<JoinForm />);
    const name = screen.getByLabelText('Exorcist name');
    expect(name).toHaveValue('Megumi_Shadows');

    await user.click(screen.getByRole('button', { name: 'Random' }));

    expect(name).not.toHaveValue('Megumi_Shadows');
    expect((name as HTMLInputElement).value).not.toBe('');
  });
});
