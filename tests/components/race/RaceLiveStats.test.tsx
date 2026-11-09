import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RaceLiveStats from '@/components/race/RaceLiveStats';
import { renderWithIntl, renderWithLocale } from '../../render';

describe('RaceLiveStats (COURSE-04)', () => {
  it('shows the live WPM and accuracy', () => {
    renderWithIntl(<RaceLiveStats wpm={87} accuracy={0.953} />);
    const group = screen.getByRole('group', { name: 'Live stats' });
    expect(group).toHaveTextContent('87');
    expect(group).toHaveTextContent('WPM');
    expect(group).toHaveTextContent('95.3%');
  });

  it('formats the accuracy the French way', () => {
    renderWithLocale(<RaceLiveStats wpm={87} accuracy={0.953} />, 'fr');
    expect(screen.getByRole('group', { name: 'Statistiques en direct' })).toHaveTextContent(/95,3\s%/);
  });
});
