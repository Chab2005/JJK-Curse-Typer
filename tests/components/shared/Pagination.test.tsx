import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Pagination from '@/components/shared/Pagination';
import { renderWithIntl } from '../../render';

describe('Pagination', () => {
  it('shows the current page out of the total', () => {
    renderWithIntl(<Pagination label="Pages" page={2} pageCount={5} onChange={() => {}} />);
    expect(screen.getByRole('navigation', { name: 'Pages' })).toHaveTextContent('Page 2 / 5');
  });

  it('disables previous on the first page and next on the last', () => {
    const { rerender } = renderWithIntl(<Pagination label="Pages" page={1} pageCount={3} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    rerender(<Pagination label="Pages" page={3} pageCount={3} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('asks for the neighbouring page when an arrow is clicked', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<Pagination label="Pages" page={2} pageCount={3} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.click(screen.getByRole('button', { name: 'Previous page' }));

    expect(onChange.mock.calls).toEqual([[3], [1]]);
  });
});
