import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Reserve from '@/components/shared/Reserve';
import { renderWithIntl } from '../../render';

describe('Reserve', () => {
  it('shows the active variant and keeps the others hidden in the layout', () => {
    renderWithIntl(<Reserve active="b" variants={{ a: 'Short', b: 'A much longer message' }} />);

    expect(screen.getByText('A much longer message').closest('[aria-hidden]')).toBeNull();
    const hidden = screen.getByText('Short').closest('[aria-hidden]');
    expect(hidden).toHaveAttribute('aria-hidden', 'true');
    expect(hidden).toHaveClass('invisible');
  });
});
