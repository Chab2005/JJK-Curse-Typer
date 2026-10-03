import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { EditableProfile } from '@/components/profile/EditProfileDialog';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { renderWithIntl } from '../../render';

const PROFILE: EditableProfile = { username: 'Maki_Heavenly', avatar: 'maki', github: 'https://github.com/maki-heavenly', discord: 'maki.zenin' };

describe('ProfileHeader (PROF-1)', () => {
  it('shows the username, GitHub link and Discord name', () => {
    renderWithIntl(<ProfileHeader profile={PROFILE} own={false} summary="148 races" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Maki_Heavenly' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'github.com/maki-heavenly' })).toHaveAttribute('href', 'https://github.com/maki-heavenly');
    expect(screen.getByText('Discord: maki.zenin')).toBeInTheDocument();
    expect(screen.getByText('148 races')).toBeInTheDocument();
  });

  it('turns a Discord link into a clickable profile link', () => {
    renderWithIntl(<ProfileHeader profile={{ ...PROFILE, discord: 'https://discord.com/users/42' }} own={false} summary="" />);

    expect(screen.getByRole('link', { name: 'Discord profile' })).toHaveAttribute('href', 'https://discord.com/users/42');
  });

  it("only lets players edit their own profile", () => {
    const { rerender } = renderWithIntl(<ProfileHeader profile={PROFILE} own={false} summary="" />);
    expect(screen.queryByRole('button', { name: 'Edit profile' })).not.toBeInTheDocument();

    rerender(<ProfileHeader profile={PROFILE} own summary="" />);
    expect(screen.getByRole('button', { name: 'Edit profile' })).toBeInTheDocument();
  });

  it('shows the saved profile and a confirmation after an edit', async () => {
    const { user } = renderWithIntl(<ProfileHeader profile={PROFILE} own summary="" />);
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    await user.type(screen.getByLabelText('Username'), '2');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Maki_Heavenly2' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Profile updated.');
  });
});
