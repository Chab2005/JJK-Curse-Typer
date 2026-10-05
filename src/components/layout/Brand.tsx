import Image from 'next/image';

// Logo et nom du site, en tête de page (Header, en-tête de course).
export default function Brand() {
  return (
    <>
      <span className="relative block w-[150px] sm:w-[170px]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[8%] -inset-y-[30%] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(245_215_122/0.28),transparent_72%)] blur-[4px]"
        />
        <Image
          src="/images/jjk-logo.png"
          alt="Jujutsu Kaisen"
          width={1164}
          height={271}
          sizes="170px"
          priority
          className="relative h-auto w-full [filter:drop-shadow(0_0_1px_#f5d77a)_drop-shadow(0_0_2px_#c9972f)]"
        />
      </span>
      <span className="text-[21px] tracking-[0.04em] whitespace-nowrap text-primary">Curse Typer</span>
    </>
  );
}
