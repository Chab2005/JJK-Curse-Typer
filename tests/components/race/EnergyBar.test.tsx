import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EnergyBar from '@/components/race/EnergyBar';
import { renderWithIntl } from '../../render';

describe('EnergyBar (BON-1)', () => {
  it('shows the energy as a meter with its value written out (UI-8)', () => {
    renderWithIntl(<EnergyBar energy={850} />);

    const meter = screen.getByRole('meter', { name: 'Energy' });
    expect(meter).toHaveAttribute('aria-valuenow', '850');
    expect(meter).toHaveAttribute('aria-valuemax', '1500');
    expect(screen.getByText('850 / 1500 EP')).toBeInTheDocument();
  });

  it('splits the bar into 15 sections of 100 EP', () => {
    const { container } = renderWithIntl(<EnergyBar energy={250} />);

    const sections = container.querySelectorAll('[data-section]');
    expect(sections).toHaveLength(15);
    expect([...sections].map((s) => s.getAttribute('data-fill'))).toEqual(['1', '1', '0.5', ...Array(12).fill('0')]);
  });

  it('says when the energy is full', () => {
    renderWithIntl(<EnergyBar energy={1500} />);

    expect(screen.getByText('Full energy!')).toBeInTheDocument();
  });
});
