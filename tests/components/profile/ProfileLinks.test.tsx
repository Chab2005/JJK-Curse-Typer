import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProfileLinks from '@/components/profile/ProfileLinks';
import { renderWithIntl } from '../../render';

describe('ProfileLinks', () => {
  it('links the GitHub profile and shows a Discord name', () => {
    renderWithIntl(<ProfileLinks github="https://github.com/megumi" discord="megumi.s" />);

    expect(screen.getByRole('link', { name: /megumi/ })).toHaveAttribute('href', 'https://github.com/megumi');
    expect(screen.getByText(/megumi\.s/)).toBeInTheDocument();
  });

  it('renders nothing without links', () => {
    const { container } = renderWithIntl(<ProfileLinks github="" discord="" />);

    expect(container).toBeEmptyDOMElement();
  });
});
