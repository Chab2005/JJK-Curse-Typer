import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EditProfileDialog, { type EditableProfile } from '@/components/profile/EditProfileDialog';
import { renderWithIntl } from '../../render';

const PROFILE: EditableProfile = { username: 'Megumi_Shadows', avatar: 'megumi', github: '', discord: '' };

async function openDialog() {
  const onSave = vi.fn();
  const view = renderWithIntl(<EditProfileDialog profile={PROFILE} onSave={onSave} />);
  await view.user.click(screen.getByRole('button', { name: 'Edit profile' }));
  return { ...view, onSave, dialog: document.querySelector('dialog')! };
}

describe('EditProfileDialog (PROF-1, PROF-3)', () => {
  it('opens a dialog filled with the current profile', async () => {
    const { dialog } = await openDialog();

    expect(dialog).toHaveAttribute('open');
    expect(screen.getByLabelText('Username')).toHaveValue('Megumi_Shadows');
    expect(screen.getByRole('radio', { name: 'Megumi Fushiguro' })).toBeChecked();
  });

  it('shows the validation errors and does not save', async () => {
    const { user, onSave, dialog } = await openDialog();
    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'ab');
    await user.type(screen.getByLabelText('GitHub profile link'), 'gitlab.com/me');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByLabelText('Username')).toHaveAccessibleDescription('Between 3 and 20 characters.');
    expect(screen.getByLabelText('GitHub profile link')).toHaveAttribute('aria-invalid', 'true');
    expect(onSave).not.toHaveBeenCalled();
    expect(dialog).toHaveAttribute('open');
  });

  it('saves the cleaned-up profile and closes', async () => {
    const { user, onSave, dialog } = await openDialog();
    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), '  Yuji_BlackFlash ');
    await user.click(screen.getByRole('radio', { name: 'Yuji Itadori' }));
    await user.type(screen.getByLabelText('GitHub profile link'), 'github.com/yuji');
    await user.type(screen.getByLabelText('Discord (link or name)'), 'yuji.itadori');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith({ username: 'Yuji_BlackFlash', avatar: 'yuji', github: 'https://github.com/yuji', discord: 'yuji.itadori' });
    expect(dialog).not.toHaveAttribute('open');
  });

  it('drops unsaved edits when cancelled and reopened', async () => {
    const { user, onSave } = await openDialog();
    await user.type(screen.getByLabelText('Username'), '_edited');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Username')).toHaveValue('Megumi_Shadows');
  });
});
