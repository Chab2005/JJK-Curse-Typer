import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Hero from '@/components/home/Hero';
import { renderWithIntl } from '../../render';

describe('Hero (smoke)', () => {
  it('renders the title, online count and calls to action', () => {
    renderWithIntl(<Hero onlineCount={42} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Curse Typer');
    expect(screen.getByText('● 42 online')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Play now/ })).toHaveAttribute('href', '/lobbies');
    expect(screen.getByRole('link', { name: /Join with a code/ })).toHaveAttribute('href', '#join');
  });
});
