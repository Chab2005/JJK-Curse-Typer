import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProfileAvatar from '@/components/layout/ProfileAvatar';
import { renderWithIntl } from '../../render';

describe('ProfileAvatar (smoke)', () => {
  it('renders the profile picture with its alt text', () => {
    renderWithIntl(<ProfileAvatar />);

    expect(screen.getByRole('img', { name: 'My profile' })).toBeInTheDocument();
  });
});
