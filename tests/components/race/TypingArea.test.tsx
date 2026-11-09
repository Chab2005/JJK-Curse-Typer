import { fireEvent, screen } from '@testing-library/react';
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

describe('TypingArea paste block (COURSE-04)', () => {
  const field = () => screen.getByLabelText('Type the text');

  it('ignores a paste', async () => {
    const onKey = vi.fn();
    const { user } = renderWithIntl(<TypingArea text="hello" input="" active onKey={onKey} />);
    await user.click(field());
    await user.paste('hello');
    expect(onKey).not.toHaveBeenCalled();
  });

  it('cancels paste, drop and Ctrl/Cmd+V', () => {
    const onKey = vi.fn();
    renderWithIntl(<TypingArea text="hello" input="" active onKey={onKey} />);

    expect(fireEvent.paste(field(), { clipboardData: { getData: () => 'hello' } })).toBe(false);
    expect(fireEvent.drop(field(), { dataTransfer: { getData: () => 'hello' } })).toBe(false);
    expect(fireEvent.keyDown(field(), { key: 'v', ctrlKey: true })).toBe(false);
    expect(fireEvent.keyDown(field(), { key: 'v', metaKey: true })).toBe(false);
    expect(fireEvent.keyDown(field(), { key: 'v' })).toBe(true);
    expect(onKey).not.toHaveBeenCalled();
  });

  it('cancels beforeinput events that insert pasted or dropped text', () => {
    renderWithIntl(<TypingArea text="hello" input="" active onKey={() => {}} />);
    for (const inputType of ['insertFromPaste', 'insertFromDrop', 'insertFromYank']) {
      const event = new InputEvent('beforeinput', { inputType, data: 'hello', cancelable: true, bubbles: true });
      field().dispatchEvent(event);
      expect(event.defaultPrevented, inputType).toBe(true);
    }
    const typing = new InputEvent('beforeinput', { inputType: 'insertText', data: 'h', cancelable: true, bubbles: true });
    field().dispatchEvent(typing);
    expect(typing.defaultPrevented).toBe(false);
  });
});
