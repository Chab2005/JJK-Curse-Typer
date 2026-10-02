import { useFormatter, useTranslations } from 'next-intl';
import type { LeaderboardCategory, PlayerStats } from './leaderboard';

/** Formate la valeur d'une catégorie pour un joueur, selon la langue (ex. `97,8 %` ou `2 390 pts`). */
export function useMetric(): (category: LeaderboardCategory, player: PlayerStats) => string {
  const t = useTranslations('Leaderboard.units');
  const format = useFormatter();

  return (category, player) => {
    switch (category) {
      case 'wpm':
        return t('wpm', { value: player.wpm });
      case 'accuracy':
        return format.number(player.accuracy, { style: 'percent', maximumFractionDigits: 1 });
      case 'score':
        return t('score', { value: format.number(player.averageScore) });
      case 'errors':
        return format.number(player.errorsPer100, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
  };
}
