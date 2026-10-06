import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RacePodium from '@/components/race/RacePodium';
import type { SummaryRow } from '@/components/race/RaceSummary';
import { renderWithIntl } from '../../render';

const ROWS: SummaryRow[] = [
  { id: 'yuji', rank: 1, name: 'Yuji', avatar: 'yuji', wpm: 81, accuracy: 0.97, status: 'finished', you: false },
  { id: 'me', rank: 2, name: 'Megumi', avatar: 'megumi', wpm: 64, accuracy: 0.952, status: 'finished', you: true },
  { id: 'bot-1', rank: 3, name: 'Cursed corpse 1', avatar: null, wpm: 30, accuracy: 0.9, status: 'timeout', you: false },
];

describe('RacePodium (smoke)', () => {
  it('renders the top 3 with their result', () => {
    renderWithIntl(<RacePodium rows={ROWS} />);

    const podium = within(screen.getByRole('region', { name: 'Race podium' }));
    expect(podium.getByText('01')).toBeInTheDocument();
    expect(podium.getByText('81 WPM')).toBeInTheDocument();
    expect(podium.getByText('Finished · 97% accuracy')).toBeInTheDocument();
    expect(podium.getByText("Time's up · 90% accuracy")).toBeInTheDocument();
    expect(podium.getByText('(you)')).toBeInTheDocument();
  });

  it('renders nothing without racers', () => {
    const { container } = renderWithIntl(<RacePodium rows={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
