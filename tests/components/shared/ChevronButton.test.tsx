import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ChevronButton from '@/components/shared/ChevronButton';
import { renderWithIntl } from '../../render';

describe('ChevronButton', () => {
  it('renders a button with its label and decorative chevrons on both sides', async () => {
    const onClick = vi.fn();
    const { user, container } = renderWithIntl(<ChevronButton type="button" onClick={onClick}>Play now</ChevronButton>);

    await user.click(screen.getByRole('button', { name: 'Play now' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(container.querySelectorAll('.arw-cap[aria-hidden="true"]')).toHaveLength(2);
  });

  it('renders as another element, such as a link', () => {
    renderWithIntl(<ChevronButton as="a" href="/lobbies" variant="primary">All lobbies</ChevronButton>);
    expect(screen.getByRole('link', { name: 'All lobbies' })).toHaveClass('arw', 'arw-md', 'arw-p');
  });
});
