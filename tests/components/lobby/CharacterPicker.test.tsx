import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CharacterPicker from '@/components/lobby/CharacterPicker';
import { renderWithIntl } from '../../render';

describe('CharacterPicker', () => {
  it('shows the chosen exorcist and reports a new choice', async () => {
    const onPick = vi.fn();
    const { user } = renderWithIntl(<CharacterPicker value="gojo" onPick={onPick} />);

    expect(screen.getByRole('button', { name: 'Satoru Gojo' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Ryomen Sukuna' }));
    expect(onPick).toHaveBeenCalledWith('sukuna');
  });
});
