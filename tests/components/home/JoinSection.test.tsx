import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import JoinSection from '@/components/home/JoinSection';
import { renderWithIntl } from '../../render';

describe('JoinSection (smoke)', () => {
  it('renders the join form next to the public rooms', () => {
    renderWithIntl(<JoinSection />);

    expect(screen.getByRole('region', { name: 'Enter the domain' })).toHaveAttribute('id', 'join');
    expect(screen.getByRole('heading', { name: 'Room seal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Public rooms' })).toBeInTheDocument();
  });
});
