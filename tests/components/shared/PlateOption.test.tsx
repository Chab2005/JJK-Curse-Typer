import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PlateOption from '@/components/shared/PlateOption';
import { renderWithIntl } from '../../render';

describe('PlateOption', () => {
  it('is a real checkbox named by its label', () => {
    renderWithIntl(<PlateOption checked onChange={() => {}}>French</PlateOption>);

    expect(screen.getByRole('checkbox', { name: 'French' })).toBeChecked();
  });

  it('reports the new state when clicked', async () => {
    const onChange = vi.fn();
    const { user } = renderWithIntl(<PlateOption checked={false} onChange={onChange}>French</PlateOption>);

    await user.click(screen.getByText('French'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('can be a radio button in a named group', () => {
    renderWithIntl(
      <>
        <PlateOption type="radio" name="sort" checked onChange={() => {}}>WPM</PlateOption>
        <PlateOption type="radio" name="sort" checked={false} onChange={() => {}}>Accuracy</PlateOption>
      </>,
    );

    expect(screen.getByRole('radio', { name: 'WPM' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Accuracy' })).not.toBeChecked();
  });
});
