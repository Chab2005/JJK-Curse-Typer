import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BevelFrame from '@/components/shared/BevelFrame';
import { renderWithIntl } from '../../render';

describe('BevelFrame', () => {
  it('wraps a bevelled face in a bevelled 1px frame', () => {
    renderWithIntl(
      <BevelFrame frame="bg-gold" className="bg-surface px-4" data-testid="frame">
        Content
      </BevelFrame>,
    );
    const frame = screen.getByTestId('frame');
    const face = screen.getByText('Content');

    expect(frame.tagName).toBe('DIV');
    expect(frame).toHaveClass('bevel', 'p-px', 'bg-gold');
    expect(face.tagName).toBe('DIV');
    expect(face).toHaveClass('bevel', 'bg-surface', 'px-4');
    expect(face.parentElement).toBe(frame);
  });

  it('renders the frame as the given element and forwards its props', async () => {
    const onClick = vi.fn();
    const { user } = renderWithIntl(
      <BevelFrame as="button" type="button" onClick={onClick} aria-label="Save">
        Save
      </BevelFrame>,
    );
    const button = screen.getByRole('button', { name: 'Save' });

    await user.click(button);

    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('type', 'button');
    // Un bouton n'accepte que du contenu en ligne : la face devient un <span>.
    expect(screen.getByText('Save').tagName).toBe('SPAN');
  });

  it('keeps a block face inside block containers', () => {
    renderWithIntl(
      <BevelFrame as="form" aria-label="Join">
        Fields
      </BevelFrame>,
    );
    expect(screen.getByRole('form', { name: 'Join' })).toBeInTheDocument();
    expect(screen.getByText('Fields').tagName).toBe('DIV');
  });
});
