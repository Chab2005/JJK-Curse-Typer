import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AuthForm from '@/components/auth/AuthForm';
import OAuthButtons from '@/components/auth/OAuthButtons';
import { renderWithIntl } from '../../render';

describe('AuthForm', () => {
  it('warns on sign-up that a lost password means a lost account (AUTH-6), not on login', () => {
    const { unmount } = renderWithIntl(<AuthForm mode="register" action={vi.fn()} />);
    expect(screen.getByText(/no password recovery/)).toBeInTheDocument();
    unmount();

    renderWithIntl(<AuthForm mode="login" action={vi.fn()} />);
    expect(screen.queryByText(/no password recovery/)).not.toBeInTheDocument();
  });

  it('asks for a username and a password only (AUTH-2)', () => {
    renderWithIntl(<AuthForm mode="register" action={vi.fn()} />);

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByLabelText(/Password/)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/Username/)).toHaveAttribute('maxlength', '20');
  });

  it('submits the form to its action and shows the error it answers', async () => {
    const action = vi.fn(async () => ({ error: 'taken' as const, username: 'gojo' }));
    const { user } = renderWithIntl(<AuthForm mode="register" action={action} />);

    await user.type(screen.getByLabelText(/Username/), 'gojo');
    await user.type(screen.getByLabelText(/Password/), 'hunter2hunter2');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('That username is already taken.'));
    expect(screen.getByLabelText(/Username/)).toHaveValue('gojo');
  });

  it('shows and hides the password', async () => {
    const { user } = renderWithIntl(<AuthForm mode="login" action={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(screen.getByLabelText(/Password/)).toHaveAttribute('type', 'text');
  });
});

describe('OAuthButtons', () => {
  it('links to the Discord and GitHub flows (AUTH-4)', () => {
    renderWithIntl(<OAuthButtons verb="login" />);

    expect(screen.getByRole('link', { name: 'Log in with Discord' })).toHaveAttribute('href', '/api/auth/discord');
    expect(screen.getByRole('link', { name: 'Log in with GitHub' })).toHaveAttribute('href', '/api/auth/github');
  });
});
