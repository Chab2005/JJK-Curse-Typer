import { screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BevelSelect from '@/components/shared/BevelSelect';
import { renderWithIntl } from '../../render';

const LEVELS = ['beginner', 'intermediate', 'expert'] as const;
type Level = (typeof LEVELS)[number];
const LABELS: Record<Level, string> = { beginner: 'Beginner', intermediate: 'Intermediate', expert: 'Expert' };

function Harness({ onChange }: { onChange: (level: Level) => void }) {
  const [level, setLevel] = useState<Level>('intermediate');
  return (
    <>
      <span id="level-label">Bot level</span>
      <BevelSelect
        labelId="level-label"
        options={LEVELS}
        value={level}
        onChange={(next) => {
          setLevel(next);
          onChange(next);
        }}
        optionLabel={(option) => LABELS[option]}
      />
      <button type="button">Outside</button>
    </>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

const combobox = () => screen.getByRole('combobox', { name: 'Bot level' });

describe('BevelSelect', () => {
  it('shows the chosen option and keeps the list closed', () => {
    renderWithIntl(<Harness onChange={() => {}} />);

    expect(combobox()).toHaveTextContent('Intermediate');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('picks an option with the mouse', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<Harness onChange={onChange} />);

    await user.click(combobox());
    expect(screen.getByRole('option', { name: 'Intermediate' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('option', { name: 'Expert' }));
    expect(onChange).toHaveBeenCalledWith('expert');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(combobox()).toHaveFocus();
  });

  it('picks an option with the keyboard', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<Harness onChange={onChange} />);

    combobox().focus();
    await user.keyboard('{ArrowDown}');
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(combobox()).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Intermediate' }).id);

    await user.keyboard('{ArrowUp}{Enter}');
    expect(onChange).toHaveBeenCalledWith('beginner');
    expect(combobox()).toHaveTextContent('Beginner');
  });

  it('opens upward when there is no room below', async () => {
    const { user } = renderWithIntl(<Harness onChange={() => {}} />);
    const root = combobox().parentElement!;
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ top: window.innerHeight - 60, bottom: window.innerHeight - 16 } as DOMRect);

    await user.click(combobox());
    expect(screen.getByRole('listbox').closest('.bottom-full')).not.toBeNull();
  });

  it('closes on Escape and on a click outside without changing the value', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<Harness onChange={onChange} />);

    combobox().focus();
    await user.keyboard('{Enter}{End}{Escape}');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');

    await user.click(combobox());
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(onChange).not.toHaveBeenCalled();
  });
});
