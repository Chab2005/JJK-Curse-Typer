import type { LobbySummary } from './lobbySearch';

// Données de démonstration en attendant la room d'index des lobbies publics (LOB-2).
export const SAMPLE_LOBBIES: LobbySummary[] = [
  { code: 'SHJ-60S', name: 'Shinjuku Showdown', host: 'John_Kaisen', players: 13, capacity: 20, bonus: true, languages: ['fr'], chars: ['uppercase', 'digits', 'punctuation'], words: 60, status: 'waiting' },
  { code: 'DMN-INF', name: 'Domaine Infini', host: 'Satoru_Infinity', players: 7, capacity: 8, bonus: true, languages: ['fr', 'en'], chars: ['uppercase'], words: 120, status: 'waiting' },
  { code: 'DJO-ZEN', name: 'Dojo Zen’in', host: 'Maki_Heavenly', players: 4, capacity: 4, bonus: false, languages: ['fr'], chars: [], words: 30, status: 'waiting' },
  { code: 'HRS-SUP', name: 'Heures sup’', host: 'Nanami_Ratio73', players: 2, capacity: 10, bonus: false, languages: ['en'], chars: ['uppercase', 'digits'], words: 73, status: 'waiting' },
  { code: 'CLO-MRT', name: 'Clous & marteau', host: 'Nobara_Resonance', players: 9, capacity: 12, bonus: true, languages: ['fr'], chars: ['uppercase', 'accents'], words: 90, status: 'waiting' },
  { code: 'BLK-FLS', name: 'Black Flash', host: 'Yuji_BlackFlash', players: 18, capacity: 20, bonus: true, languages: ['en'], chars: ['uppercase', 'digits', 'punctuation'], words: 60, status: 'racing' },
  { code: 'BGW-OGI', name: 'Boogie Woogie', host: 'Todo_BoogieWoogie', players: 5, capacity: 6, bonus: true, languages: ['fr'], chars: [], words: 45, status: 'waiting' },
  { code: 'MTS-MDT', name: 'Mots maudits', host: 'Toge_Onigiri', players: 3, capacity: 5, bonus: false, languages: ['fr'], chars: ['uppercase', 'accents'], words: 50, status: 'waiting' },
  { code: 'NVC-KYT', name: 'Novices de Kyoto', host: 'Panda_Gorilla', players: 2, capacity: 4, bonus: false, languages: ['en'], chars: [], words: 30, status: 'waiting' },
  { code: 'SPR-60S', name: 'Sprint 60s', host: 'Yuta_Rika', players: 31, capacity: 40, bonus: true, languages: ['fr', 'en'], chars: ['uppercase', 'digits'], words: 100, status: 'waiting' },
  { code: 'CRB-MEI', name: 'Corbeaux', host: 'Mei_Mei', players: 6, capacity: 6, bonus: true, languages: ['fr'], chars: ['uppercase', 'digits', 'punctuation'], words: 80, status: 'waiting' },
  { code: 'SNC-MDT', name: 'Sanctuaire Maudit', host: 'Choso_Blood', players: 3, capacity: 5, bonus: false, languages: ['en'], chars: ['uppercase'], words: 120, status: 'waiting' },
  { code: 'JKP-HKR', name: 'Jackpot', host: 'Hakari_Jackpot', players: 11, capacity: 16, bonus: true, languages: ['en'], chars: ['uppercase', 'digits', 'punctuation'], words: 75, status: 'racing' },
  { code: 'PLM-KSM', name: 'Pluie de lames', host: 'Kasumi_Miwa', players: 1, capacity: 8, bonus: false, languages: ['fr'], chars: ['accents'], words: 40, status: 'waiting' },
  { code: 'TKY-HGH', name: 'Tokyo Jujutsu High', host: 'Megumi_Shadows', players: 8, capacity: 12, bonus: true, languages: ['fr', 'en'], chars: ['uppercase', 'punctuation', 'accents'], words: 150, status: 'waiting' },
];
