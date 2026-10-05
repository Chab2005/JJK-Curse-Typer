import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProfileAvatar from '@/components/layout/ProfileAvatar';
import { renderWithIntl } from '../../render';

describe('ProfileAvatar', () => {
  it('shows the first two letters of the name without an uploaded picture', () => {
    renderWithIntl(<ProfileAvatar account={{ username: 'megumi', displayName: 'Megumi', avatarUrl: null }} />);

    expect(screen.getByText('ME')).toBeInTheDocument();
  });

  it('shows the uploaded picture when there is one', () => {
    const { container } = renderWithIntl(<ProfileAvatar account={{ username: 'megumi', displayName: 'Megumi', avatarUrl: '/api/avatar/megumi?v=1' }} />);

    expect(container.querySelector('img')).toHaveAttribute('src', '/api/avatar/megumi?v=1');
    expect(screen.queryByText('ME')).not.toBeInTheDocument();
  });
});
