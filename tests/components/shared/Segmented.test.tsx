import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Segmented from '@/components/shared/Segmented';
import { renderWithIntl } from '../../render';

const OPTIONS = ['7d', '30d', 'all'] as const;

describe('Segmented', () => {
  it('marks only the selected option as pressed', () => {
    renderWithIntl(<Segmented label="Period" options={OPTIONS} value="30d" onChange={() => {}} optionLabel={(o) => o.toUpperCase()} />);

    expect(screen.getByRole('group', { name: 'Period' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30D' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '7D' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'ALL' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the clicked option', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<Segmented label="Period" options={OPTIONS} value="30d" onChange={onChange} optionLabel={(o) => o} />);

    await user.click(screen.getByRole('button', { name: 'all' }));

    expect(onChange).toHaveBeenCalledWith('all');
  });
});
