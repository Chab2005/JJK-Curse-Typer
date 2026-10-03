import { blackFlashBolts } from './blackFlashGeometry';

const CYCLE_SECONDS = 3.4;
const BOLTS = blackFlashBolts(35, 1999, CYCLE_SECONDS).map((bolt, i) => (i % 3 === 0 ? { ...bolt, delay: 0 } : bolt));

export default function BlackFlash() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 size-[max(2400px,180vw)] -translate-x-1/2 -translate-y-1/2">
      <div className="absolute inset-[30%] rounded-full bg-[radial-gradient(circle,rgb(225_29_72/0.55),rgb(147_0_10/0.3)_40%,transparent_70%)] opacity-0 animate-[black-flash-burst_3.4s_linear_infinite] motion-reduce:hidden" />
      <div className="absolute inset-[45%] rounded-full bg-[radial-gradient(circle,rgb(255_179_182/0.5),rgb(225_29_72/0.35)_35%,transparent_70%)] blur-xl animate-[impact-pulse_1.7s_ease-in-out_infinite] motion-reduce:animate-none" />

      <svg viewBox="-500 -500 1000 1000" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <filter id="black-flash-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        {BOLTS.map((bolt, i) => (
          <g
            key={i}
            className="opacity-0 animate-[black-flash_3.4s_linear_infinite] motion-reduce:animate-none motion-reduce:opacity-30"
            style={{ animationDelay: `${bolt.delay}s` }}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <g stroke="#e11d48" strokeWidth="11" filter="url(#black-flash-glow)">
              <path d={bolt.main} />
              {bolt.branches.map((d) => <path key={d} d={d} strokeWidth="7" />)}
            </g>
            <g stroke="#050505" strokeWidth="3.8">
              <path d={bolt.main} />
              {bolt.branches.map((d) => <path key={d} d={d} strokeWidth="2.4" />)}
            </g>
            <g stroke="#050505" strokeWidth="0.9" opacity="0.75">
              <path d={bolt.main} />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
