'use client';

import { useState, type AnimationEvent } from 'react';
import { boltStrands, slotAngle, type Strand } from './blackFlashGeometry';

type Props = {
  strands: Strand[];
  delay: number;
  index: number;
  count: number;
};

/** Un éclair qui se redessine au hasard (forme et angle) à chaque nouveau cycle, pour ne jamais répéter le même motif. */
export default function BlackFlashBolt({ strands: initialStrands, delay, index, count }: Props) {
  const [strands, setStrands] = useState(initialStrands);

  const redraw = (event: AnimationEvent) => {
    if (event.animationName === 'black-flash') setStrands(boltStrands(slotAngle(index, count, Math.random), Math.random));
  };

  return (
    <g
      className="opacity-0 animate-[black-flash_3.4s_step-end_infinite,black-flash-grow_3.4s_linear_infinite] motion-reduce:animate-none motion-reduce:opacity-30"
      style={{ animationDelay: `${delay}s` }}
      onAnimationIteration={redraw}
    >
      <g fill="#e11d48" stroke="#e11d48" strokeLinejoin="round" filter="url(#black-flash-glow)" opacity="0.85">
        {strands.map((strand) => <path key={strand.line} d={strand.rim} strokeWidth={strand.glow} />)}
      </g>
      <g fill="#ff2d55">
        {strands.map((strand) => <path key={strand.rim} d={strand.rim} />)}
      </g>
      <g fill="#050505">
        {strands.map((strand) => <path key={strand.core} d={strand.core} />)}
      </g>
    </g>
  );
}
