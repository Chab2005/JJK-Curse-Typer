import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TechniqueExample from '@/components/characters/TechniqueExample';
import { EXAMPLE_MS } from '@/components/characters/techniqueDemo';
import { renderWithIntl } from '../../render';

const reducedMotion = (reduce: boolean) => vi.stubGlobal('matchMedia', () => ({ matches: reduce }));
const phase = () => screen.getByTestId('technique-example').dataset.phase;

describe('TechniqueExample', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('plays Todo falling behind, casting Boogie-Woogie, then swapping places with the leader', () => {
    reducedMotion(false);
    renderWithIntl(<TechniqueExample character="todo" />);
    expect(phase()).toBe('before');
    expect(screen.getByText(/Todo is lagging behind and Yuji leads/)).toBeInTheDocument();
    expect(screen.getByText('Step 1 / 3')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(EXAMPLE_MS.before));
    expect(phase()).toBe('cast');
    expect(screen.getByText('« Boogie-Woogie »')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(EXAMPLE_MS.cast));
    expect(phase()).toBe('after');
    expect(screen.getByText(/Todo and Yuji swap places/)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(EXAMPLE_MS.after));
    expect(phase()).toBe('before');
  });

  it('stays on the result when the user wants less motion', () => {
    reducedMotion(true);
    renderWithIntl(<TechniqueExample character="todo" />);
    expect(phase()).toBe('after');
    act(() => vi.advanceTimersByTime(EXAMPLE_MS.after * 3));
    expect(phase()).toBe('after');
  });

  it.each([
    ['blackFlash', 'Black Flash', /stunned for 2 to 3 s/],
    ['divergentFist', 'Divergent Fist', /characters appear late/],
  ] as const)('plays Yuji’s %s with its own impact and result', (ability, name, result) => {
    reducedMotion(false);
    const { container } = renderWithIntl(<TechniqueExample character="yuji" ability={ability} />);
    expect(phase()).toBe('before');
    expect(screen.getByRole('heading', { name: `Race example · ${name}` })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(EXAMPLE_MS.before));
    expect(phase()).toBe('cast');
    expect(screen.getByText(`« ${name} »`)).toBeInTheDocument();
    expect(screen.getByTestId('yuji-impact')).toHaveAttribute('data-ability', ability);
    expect(container.querySelector('[data-swap-effect]')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(EXAMPLE_MS.cast));
    expect(phase()).toBe('after');
    expect(screen.getByText(result)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(EXAMPLE_MS.after));
    expect(phase()).toBe('before');
    expect(screen.queryByTestId('yuji-impact')).not.toBeInTheDocument();
  });

  it.each([
    ['resonance', 'Resonance', /stunned for 3 to 5 s/],
    ['hairpin', 'Hairpin', /extra words/],
  ] as const)('plays Nobara’s %s on Yuji with its own nail and result', (ability, name, result) => {
    reducedMotion(false);
    renderWithIntl(<TechniqueExample character="nobara" ability={ability} />);
    expect(screen.getByRole('heading', { name: `Race example · ${name}` })).toBeInTheDocument();
    expect(screen.getByText(/Nobara is behind Yuji/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(EXAMPLE_MS.before));
    expect(screen.getByText(`« ${name} »`)).toBeInTheDocument();
    expect(screen.getByTestId('nobara-impact')).toHaveAttribute('data-ability', ability);
    act(() => vi.advanceTimersByTime(EXAMPLE_MS.cast));
    expect(phase()).toBe('after');
    expect(screen.getByText(result)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(EXAMPLE_MS.after));
    expect(screen.queryByTestId('nobara-impact')).not.toBeInTheDocument();
  });

  it('shows the words Hairpin added to Yuji’s text', () => {
    reducedMotion(true);
    renderWithIntl(<TechniqueExample character="nobara" ability="hairpin" />);
    expect(screen.getByTestId('hairpin-words')).toHaveTextContent('straw nail');
  });

  it.each(['blackFlash', 'divergentFist'] as const)('shows a static %s result with reduced motion', (ability) => {
    reducedMotion(true);
    renderWithIntl(<TechniqueExample character="yuji" ability={ability} />);
    expect(phase()).toBe('after');
    expect(screen.queryByTestId('yuji-impact')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(15000));
    expect(phase()).toBe('after');
  });
});
