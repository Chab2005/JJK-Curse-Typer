import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FilterPopover from '@/components/shared/FilterPopover';
import { renderWithIntl } from '../../render';

function renderPopover(props: Partial<React.ComponentProps<typeof FilterPopover>> = {}) {
  return renderWithIntl(
    <FilterPopover label="Filters" closeLabel="Close" {...props}>
      <p>Panel content</p>
    </FilterPopover>,
  );
}

describe('FilterPopover', () => {
  it('starts closed and opens on click', async () => {
    const { user } = renderPopover();
    const button = screen.getByRole('button', { name: 'Filters' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Panel content')).not.toBeVisible();

    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Panel content')).toBeVisible();
  });

  it('closes with Escape and gives focus back to the button', async () => {
    const { user } = renderPopover();
    const button = screen.getByRole('button', { name: 'Filters' });
    await user.click(button);

    await user.keyboard('{Escape}');

    expect(screen.getByText('Panel content')).not.toBeVisible();
    expect(button).toHaveFocus();
  });

  it('closes on a click outside, but not on a click inside', async () => {
    const { user } = renderPopover();
    await user.click(screen.getByRole('button', { name: 'Filters' }));

    await user.click(screen.getByText('Panel content'));
    expect(screen.getByText('Panel content')).toBeVisible();

    await user.click(document.body);
    expect(screen.getByText('Panel content')).not.toBeVisible();
  });

  it('closes with its close button', async () => {
    const { user } = renderPopover();
    await user.click(screen.getByRole('button', { name: 'Filters' }));

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByText('Panel content')).not.toBeVisible();
  });

  it('shows the active filter count only when above zero', () => {
    const { rerender } = renderPopover({ badge: 0 });
    expect(screen.queryByText('0')).not.toBeInTheDocument();

    rerender(
      <FilterPopover label="Filters" closeLabel="Close" badge={2}>
        <p>Panel content</p>
      </FilterPopover>,
    );
    expect(screen.getByRole('button', { name: /^Filters/ })).toContainElement(screen.getByText('2'));
  });

  it('shows a reset button only when onReset is given', async () => {
    const onReset = vi.fn();
    const { user, rerender } = renderPopover();
    expect(screen.queryByRole('button', { name: 'Reset', hidden: true })).not.toBeInTheDocument();

    rerender(
      <FilterPopover label="Filters" closeLabel="Close" resetLabel="Reset" onReset={onReset}>
        <p>Panel content</p>
      </FilterPopover>,
    );
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onReset).toHaveBeenCalledOnce();
  });
});
