import { describe, expect, it } from 'vitest';
import LobbyTable from '@/components/lobbies/LobbyTable';
import RaceSummary, { type SummaryRow } from '@/components/race/RaceSummary';
import Pagination from '@/components/shared/Pagination';
import { renderWithLocale } from '../render';

const ROW: SummaryRow = { id: 'me', rank: 1, name: 'Megumi', avatar: 'megumi', wpm: 1234, rawWpm: 1300, errors: 2, endedAt: 30000, received: 1, accuracy: 0.952, status: 'finished', you: true };

// Testing Library replaces non-breaking spaces by plain ones in its matchers: compare the raw text instead.
const present = (expected: string) => expect(document.body.textContent).toContain(expected);

// Les nombres suivent la langue (I18N-03) : espace fine insécable en français, virgule en anglais.
describe('number formatting follows the locale (I18N-03)', () => {
  it('formats WPM and the accuracy percentage in French', () => {
    renderWithLocale(<RaceSummary rows={[ROW]} you="me" over={false} lobbyCode="ABC-DEF" />, 'fr');
    present('1 234 MPM · précision de 95 %');
  });

  it('formats the same values the English way', () => {
    renderWithLocale(<RaceSummary rows={[ROW]} you="me" over={false} lobbyCode="ABC-DEF" />, 'en');
    present('1,234 WPM · 95% accuracy');
  });

  it('formats players, capacity and word counts in French', () => {
    renderWithLocale(<LobbyTable lobbies={[{ code: 'AAA-AAA', name: 'Big', host: 'H', players: 1200, capacity: 3000, bonus: false, languages: ['fr'], chars: [], words: 1500, status: 'waiting' }]} />, 'fr');
    present('1 200/3 000');
    present('1 500 mots');
  });

  it('formats pagination counts in French', () => {
    renderWithLocale(<Pagination label="Pages" page={1} pageCount={1500} onChange={() => {}} />, 'fr');
    present('Page 1 / 1 500');
  });
});
