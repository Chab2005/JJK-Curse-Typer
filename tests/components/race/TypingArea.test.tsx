import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TypingArea from '@/components/race/TypingArea';
import { renderWithIntl } from '../../render';

describe('TypingArea', () => {
  it('sends every typed character and Backspace', async () => {
    const onKey = vi.fn();
    const { user } = renderWithIntl(<TypingArea text="hello world" input="" active onKey={onKey} />);

    await user.type(screen.getByLabelText('Type the text'), 'he{Backspace}');
    expect(onKey.mock.calls.map(([key]) => key)).toEqual(['h', 'e', 'Backspace']);
  });

  it('marks correct, wrong and pending characters, not only with colour (UI-8)', () => {
    const { container } = renderWithIntl(<TypingArea text="abc" input="ax" active onKey={() => {}} />);

    const states = [...container.querySelectorAll('[data-state]')].map((c) => c.getAttribute('data-state'));
    expect(states).toEqual(['correct', 'wrong', 'pending']);
    expect(container.querySelector('[data-caret]')).toHaveTextContent('c');
  });

  it('keeps the whole text readable for screen readers', () => {
    renderWithIntl(<TypingArea text="abc def" input="" active onKey={() => {}} />);

    expect(screen.getByText('abc def', { selector: 'p' })).toBeInTheDocument();
  });

  it('ignores typing while inactive', async () => {
    const onKey = vi.fn();
    const { user } = renderWithIntl(<TypingArea text="abc" input="" active={false} onKey={onKey} />);

    await user.type(screen.getByLabelText('Type the text'), 'a');
    expect(onKey).not.toHaveBeenCalled();
  });
});
