import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RaceFooter from '@/components/race/RaceFooter';
import { renderWithIntl } from '../../render';

describe('RaceFooter', () => {
  it('renders a sober footer without links', () => {
    renderWithIntl(<RaceFooter />);

    expect(screen.getByRole('contentinfo')).toHaveTextContent('Stay focused, exorcist.');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
