import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SearchField from '@/components/shared/SearchField';
import { renderWithIntl } from '../../render';

describe('SearchField', () => {
  it('is a search box named by its label', () => {
    renderWithIntl(<SearchField id="search" label="Host or lobby name" value="maki" onChange={() => {}} />);
    expect(screen.getByRole('searchbox', { name: 'Host or lobby name' })).toHaveValue('maki');
  });

  it('reports every keystroke', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<SearchField id="search" label="Search" value="" onChange={onChange} />);

    await user.type(screen.getByRole('searchbox'), 'ab');

    expect(onChange.mock.calls).toEqual([['a'], ['b']]);
  });
});
