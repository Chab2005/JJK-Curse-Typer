import { useId } from 'react';

// Flèche en lance (canvas « Flèches stylisées · croissant ») : une tête de deux chevrons barbelés, puis un manche
// en losange couché qui s'effile jusqu'à une pointe fine. Dessinée vers la gauche, retournée pour `right`.
// La couleur vient de `currentColor` ; la taille, des classes (`w-24 h-8`…), le dessin gardant ses proportions.
export default function SpearArrow({ direction, className = '' }: { direction: 'left' | 'right'; className?: string }) {
  const gradient = useId();

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 168 56"
      className={`overflow-visible ${direction === 'right' ? '-scale-x-100' : ''} ${className}`}
    >
      <defs>
        <linearGradient id={gradient} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" />
          <stop offset="0.45" stopColor="currentColor" stopOpacity="0.75" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M23.3 28 26.15 24C72 25.8 122 27.2 168 27.8v0.4C122 28.8 72 30.2 26.15 32z" fill={`url(#${gradient})`} />
      <g transform="translate(3 0) scale(1.4)">
        <path d="M5.51 20 13.43 7.04 10.19 17.64 8.75 20 10.19 22.36 13.43 32.96z" fill="currentColor" opacity=".8" />
        <path d="M-1 20 10 2 5.5 16.73 3.5 20 5.5 23.27 10 38z" fill="currentColor" />
      </g>
    </svg>
  );
}
