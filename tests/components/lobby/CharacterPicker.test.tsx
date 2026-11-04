import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CharacterPicker from '@/components/lobby/CharacterPicker';
import { renderWithIntl } from '../../render';

const block = () => within(screen.getByRole('region', { name: 'Your exorcist' }));

describe('CharacterPicker', () => {
  it('starts on Yuji when nothing was picked', () => {
    renderWithIntl(<CharacterPicker value={null} onPick={() => {}} />);

    expect(block().getByText('Yuji Itadori')).toBeInTheDocument();
    expect(block().getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });

  it('shows the chosen exorcist and what they can do', () => {
    renderWithIntl(<CharacterPicker value="todo" onPick={() => {}} />);

    expect(block().getByText('Aoi Todo')).toBeInTheDocument();
    expect(block().getByTestId('exorcist-sprite').style.background).toContain('todo-idle.png');
    expect(block().getByText(/swap places with anything/)).toBeVisible();
    expect(block().getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });

  it('opens a window to choose, and closes it once a choice is made', async () => {
    const onPick = vi.fn();
    const { user } = renderWithIntl(<CharacterPicker value="gojo" onPick={onPick} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Change' }));

    const dialog = within(screen.getByRole('dialog', { name: 'Choose your exorcist' }));
    expect(dialog.getByRole('button', { name: 'Satoru' })).toHaveAttribute('aria-pressed', 'true');
    expect(dialog.queryByText('Satoru Gojo')).not.toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Ryomen' }));

    expect(onPick).toHaveBeenCalledWith('sukuna');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes without a choice', async () => {
    const onPick = vi.fn();
    const { user } = renderWithIntl(<CharacterPicker value={null} onPick={onPick} />);

    await user.click(screen.getByRole('button', { name: 'Change' }));
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Yuji' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onPick).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
