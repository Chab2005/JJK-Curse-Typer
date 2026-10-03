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
  });

  it('sends each change made by the host', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Real text' }));
    expect(onChange).toHaveBeenLastCalledWith({ content: 'sentences' });

    await user.click(screen.getByRole('checkbox', { name: 'Enable bonuses' }));
    expect(onChange).toHaveBeenLastCalledWith({ bonus: true });

    await user.click(screen.getByRole('checkbox', { name: 'Digits (0-9)' }));
    expect(onChange).toHaveBeenLastCalledWith({ chars: ['uppercase'] });

    await user.selectOptions(screen.getByLabelText('Race timer'), '180');
    expect(onChange).toHaveBeenLastCalledWith({ timer: 180 });
  });

  it('commits the length and capacity when the field loses focus', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable onChange={onChange} />);

    const capacity = screen.getByLabelText('Capacity');
    await user.clear(capacity);
    await user.type(capacity, '20');
    expect(onChange).not.toHaveBeenCalled();

    await user.tab();
    expect(onChange).toHaveBeenCalledWith({ capacity: 20 });
    expect(screen.getByText('Between 3 and 60 participants.')).toBeInTheDocument();
  });

  it('puts back the current value when the field is left empty', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<LobbySettingsPanel settings={SETTINGS} participantCount={3} editable onChange={onChange} />);

    const words = screen.getByLabelText('Length (words)');
    await user.clear(words);
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
    expect(words).toHaveValue(60);
  });
});
