import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LobbySettingsPanel from '@/components/lobby/LobbySettingsPanel';
import type { LobbySettings } from '@/components/lobby/lobbyRoom';
import { renderWithIntl } from '../../render';

const SETTINGS: LobbySettings = {
  languages: ['fr', 'en'],
  content: 'words',
  words: 60,
  chars: ['uppercase', 'digits'],
  practice: ',.',
  timer: 90,
  errorMode: 'block',
  bonus: false,
  capacity: 12,
  visibility: 'code',
};

describe('LobbySettingsPanel (LOB-5)', () => {
  it('shows a read-only summary to players', () => {
    renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable={false} onChange={() => {}} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('French · English')).toBeInTheDocument();
    expect(screen.getByText('Random words')).toBeInTheDocument();
    expect(screen.getByText('60 words')).toBeInTheDocument();
    expect(screen.getByText('a-Z 0-9')).toBeInTheDocument();
    expect(screen.getByText('1.5 min')).toBeInTheDocument();
    expect(screen.getByText('Block until fixed')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('12 participants')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
  });

  it('shows the host the summary with an edit button', () => {
    renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable onChange={() => {}} />);

    expect(screen.getByText('French · English')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit settings' })).toBeInTheDocument();
    expect(screen.queryByText('Only the host can change these settings.')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sends the host changes only when they are saved', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Edit settings' }));
    await user.click(screen.getByRole('button', { name: 'Real text' }));
    await user.click(screen.getByRole('checkbox', { name: 'Enable bonuses' }));
    await user.click(screen.getByRole('checkbox', { name: 'Digits (0-9)' }));
    await user.click(screen.getByRole('combobox', { name: 'Race timer' }));
    await user.click(screen.getByRole('option', { name: '3 min' }));
    await user.click(screen.getByRole('button', { name: 'Private' }));
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({ content: 'sentences', bonus: true, chars: ['uppercase'], timer: 180, visibility: 'private' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('drops the changes on cancel and starts from the current settings next time', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Edit settings' }));
    await user.click(screen.getByRole('checkbox', { name: 'Enable bonuses' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Edit settings' }));
    expect(screen.getByRole('checkbox', { name: 'Enable bonuses' })).not.toBeChecked();
  });

  it('sends nothing when saved without changes', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Edit settings' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps at least one text language', async () => {
    const { user } = renderWithIntl(<LobbySettingsPanel settings={{ ...SETTINGS, languages: ['fr'] }} participantCount={3} editable onChange={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Edit settings' }));
    expect(screen.getByRole('checkbox', { name: 'French' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'English' })).toBeEnabled();
  });

  it('explains the chosen access (LOB-1)', async () => {
    const { user } = renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable onChange={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Edit settings' }));
    expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Hidden from the lobby list. Join with the code or an invite link.')).toBeInTheDocument();
  });

  it('commits the length and capacity when the field loses focus', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Edit settings' }));

    const capacity = screen.getByLabelText('Capacity');
    await user.clear(capacity);
    await user.type(capacity, '20');
    await user.tab();
    expect(capacity).toHaveValue(20);
    expect(screen.getByText('Between 3 and 60 participants.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onChange).toHaveBeenCalledWith({ capacity: 20 });
  });

  it('bounds the length as soon as the field loses focus', async () => {
    const { user } = renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable onChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Edit settings' }));

    const words = screen.getByLabelText('Length (words)');
    await user.clear(words);
    await user.type(words, '999');
    await user.tab();
    expect(words).toHaveValue(300);
  });

  it('steps the length with the − and + buttons, within its bounds', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<LobbySettingsPanel settings={{ ...SETTINGS, words: 299 }} participantCount={3} editable onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Edit settings' }));

    await user.click(screen.getByRole('button', { name: 'Increase Length (words)' }));
    expect(screen.getByLabelText('Length (words)')).toHaveValue(300);
    expect(screen.getByRole('button', { name: 'Increase Length (words)' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Decrease Length (words)' }));
    await user.click(screen.getByRole('button', { name: 'Decrease Length (words)' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onChange).toHaveBeenCalledWith({ words: 298 });
  });

  it('puts back the current value when the field is left empty', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Edit settings' }));

    const words = screen.getByLabelText('Length (words)');
    await user.clear(words);
    await user.tab();
    expect(words).toHaveValue(60);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
