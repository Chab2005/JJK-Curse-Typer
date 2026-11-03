import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Abilities from '@/components/characters/Abilities';
import { renderWithIntl } from '../../render';

describe('Yuji’s hover sparks', () => {
  it('switches both ability cards from the clean sheet to the denser hover sheet', () => {
    renderWithIntl(<Abilities character="yuji" />);
    for (const name of ['Black Flash', 'Divergent Fist']) {
      const card = screen.getByRole('heading', { name }).closest('li')!;
      const corner = within(card).getByTestId('shikigami');
      expect(corner.children).toHaveLength(2);
      const [idle, hover] = Array.from(corner.children) as HTMLElement[];
      expect(idle).toHaveClass('group-hover/card:invisible', 'motion-reduce:group-hover/card:visible');
      expect(hover).toHaveClass('invisible', 'group-hover/card:visible', 'motion-reduce:hidden');
      expect(hover.style.background).toContain('-hover.png');
      expect(hover.style.background).not.toBe(idle.style.background);
      expect([hover.style.width, hover.style.height]).toEqual([idle.style.width, idle.style.height]);
    }
  });
});
