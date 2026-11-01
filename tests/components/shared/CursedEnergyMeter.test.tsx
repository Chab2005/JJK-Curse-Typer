import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CursedEnergyMeter from '@/components/shared/CursedEnergyMeter';

describe('CursedEnergyMeter (BON-1 / UI-8)', () => {
  it.each(['yuji', 'megumi', 'nobara', 'gojo', 'maki', 'yuta', 'todo', 'sukuna'] as const)(
    'gives %s the correct energy palette', (character) => {
      render(<CursedEnergyMeter energy={750} label="Energy" valueText="750 EP" character={character} />);
      expect(screen.getByRole('meter')).toHaveAttribute('data-affinity', character === 'sukuna' ? 'sukuna' : character === 'yuta' ? 'yuta' : 'default');
    },
  );
  it.each([[-100, 0, 'empty'], [750, 750, 'charging'], [2000, 1500, 'full']])(
    'keeps aura strength and the announced value in sync for %s EP',
    (energy, expected, state) => {
      render(<CursedEnergyMeter energy={energy} label="Cursed energy" valueText={`${expected} EP`} />);
      const meter = screen.getByRole('meter', { name: 'Cursed energy' });
      expect(meter).toHaveAttribute('aria-valuenow', String(expected));
      expect(meter).toHaveAttribute('aria-valuetext', `${expected} EP`);
      expect(meter).toHaveAttribute('data-state', state);
      expect(meter.style.getPropertyValue('--ce-level')).toBe(String(expected / 1500));
    },
  );

  it('keeps the aura mounted while typing updates the charge', () => {
    const { container, rerender } = render(<CursedEnergyMeter energy={200} label="Energy" valueText="200 EP" compact />);
    const aura = container.querySelector('.ce-surface');
    expect(aura).not.toBeNull();
    rerender(<CursedEnergyMeter energy={800} label="Energy" valueText="800 EP" compact />);
    expect(container.querySelector('.ce-surface')).toBe(aura);
    expect(screen.getByRole('meter')).toHaveClass('ce-compact');
  });

  it('reveals a fixed-size aura and bar through one shared fill value', () => {
    const { container, rerender } = render(<CursedEnergyMeter energy={300} label="Energy" valueText="300 EP" />);
    const charge = container.querySelector<HTMLElement>('.ce-charge')!;
    const field = container.querySelector<HTMLElement>('.ce-field')!;
    expect(charge.style.width).toBe('');
    expect(field.style.width).toBe('');
    expect(screen.getByRole('meter').style.getPropertyValue('--ce-fill')).toBe('20%');
    rerender(<CursedEnergyMeter energy={900} label="Energy" valueText="900 EP" />);
    expect(screen.getByRole('meter').style.getPropertyValue('--ce-fill')).toBe('60%');
    expect(charge.style.width).toBe('');
  });
});
