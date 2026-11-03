'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { drawTodoSwapLayer, TODO_SWAP_AT, TODO_SWAP_MS, todoSwapFrame } from './todoSwapAnimation';
import { EXAMPLE_MS } from './techniqueDemo';

/** Two canvas layers wrap the sprite so the rings pass behind and in front of the body. */
export default function TodoSwapEffect({ active, bodyWidth, width, height, children }: {
  active: boolean;
  bodyWidth: number;
  width: number;
  height: number;
  children: ReactNode;
}) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<HTMLSpanElement>(null);
  const canvasWidth = Math.ceil(bodyWidth * 2.3);

  useEffect(() => {
    if (!active) return;
    const back = backRef.current;
    const front = frontRef.current;
    const sprite = spriteRef.current;
    const backContext = back?.getContext('2d');
    const frontContext = front?.getContext('2d');
    if (!back || !front || !sprite || !backContext || !frontContext) return;
    let animation = 0;
    // The parent changes positions exactly at the flash peak, at the end of the cast.
    const delay = EXAMPLE_MS.cast - TODO_SWAP_MS * TODO_SWAP_AT;
    const start = performance.now() + delay;
    function tick(now: number) {
      const progress = Math.max(0, Math.min(1, (now - start) / TODO_SWAP_MS));
      const frame = todoSwapFrame(progress, bodyWidth, height);
      drawTodoSwapLayer(backContext!, frame, canvasWidth, height, bodyWidth, false);
      drawTodoSwapLayer(frontContext!, frame, canvasWidth, height, bodyWidth, true);
      sprite!.style.opacity = String(1 - frame.flash * 0.75);
      if (progress < 1) animation = requestAnimationFrame(tick);
    }
    const timer = setTimeout(() => { animation = requestAnimationFrame(tick); }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animation);
      backContext.clearRect(0, 0, canvasWidth, height + 4);
      frontContext.clearRect(0, 0, canvasWidth, height + 4);
      sprite.style.opacity = '1';
    };
  }, [active, bodyWidth, canvasWidth, height]);

  const layer = 'pointer-events-none absolute top-0 left-1/2 block -translate-x-1/2 [image-rendering:pixelated]';
  return (
    <span data-swap-effect="clean-echo" className="relative block" style={{ width, height }}>
      <canvas ref={backRef} aria-hidden="true" width={canvasWidth} height={height + 4} className={`${layer} z-0`} />
      <span ref={spriteRef} className="absolute bottom-0 left-1/2 z-10 block -translate-x-1/2">{children}</span>
      <canvas ref={frontRef} aria-hidden="true" width={canvasWidth} height={height + 4} className={`${layer} z-20`} />
    </span>
  );
}
