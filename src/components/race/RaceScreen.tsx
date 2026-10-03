'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { MAX_STROKES_PER_BATCH, type ServerMessage } from '@/game/protocol';
import { leaderGap, type RacerSeat } from '@/game/race';
import { typingScore } from '@/game/scoring';
import { startTyping, typeKey, type Keystroke, type TypingState } from '@/game/typing';
import { useRouter } from '@/i18n/navigation';
import ConfirmDialog from './ConfirmDialog';
import Countdown from './Countdown';
import EnergyBar from './EnergyBar';
import RaceHeader from './RaceHeader';
import RaceHud from './RaceHud';
import RaceSummary, { type SummaryRow } from './RaceSummary';
import RaceTrack from './RaceTrack';
import TypingArea from './TypingArea';
import { formatClock, initialRaceView, raceViewReducer, trackRunners } from './raceView';
import { useRaceSocket } from './useRaceSocket';

/** Les frappes partent par lots toutes les 150 ms (RACE-14, TECH-7). */
const FLUSH_MS = 150;
/** Durée d'une annonce de dépassement dans la zone d'animation. */
const BANNER_MS = 2500;
/** Le « Partez ! » reste affiché un instant après le départ. */
const GO_MS = 800;

type Pending = { kind: 'abandon' } | { kind: 'leave'; href: string } | null;

function useNow(intervalMs: number, enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, enabled]);
  return now;
}

// Écran de course (maquette « Course ») rendu côté client (TECH-8) : la room fait foi (RACE-14),
// le joueur voit sa frappe tout de suite grâce au même réducteur que le serveur.
export default function RaceScreen({ code, lobbyName }: { code: string; lobbyName: string }) {
  const t = useTranslations('Race');
  const tLobby = useTranslations('Lobby.participants');
  const router = useRouter();
  const [view, setView] = useState(initialRaceView);
  const [typing, setTyping] = useState<TypingState | null>(null);
  const [abandoned, setAbandoned] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  // La saisie et les frappes à envoyer vivent aussi dans des refs : plusieurs touches peuvent arriver dans le même événement.
  const typingRef = useRef<TypingState | null>(null);
  const outbox = useRef<Keystroke[]>([]);

  const replaceTyping = (next: TypingState | null) => {
    typingRef.current = next;
    outbox.current = [];
    setTyping(next);
  };

  const { status, send } = useRaceSocket(code, (message: ServerMessage) => {
    const receivedAt = Date.now();
    setView((current) => raceViewReducer(current, message, receivedAt));
    if (message.type === 'welcome') {
      setAbandoned(false);
      replaceTyping(message.you ? (message.typing ?? startTyping(message.race.text, message.race.mode)) : null);
    }
    if (message.type === 'resync') replaceTyping(message.typing);
  });

  const { race, you, startAt, phase, standings } = view;
  const now = useNow(100, race !== null && phase !== 'finished');
  const elapsed = startAt === null ? -Infinity : now - startAt;
  const timeUp = race !== null && race.timerMs > 0 && elapsed >= race.timerMs;
  const mine = standings.find((s) => s.id === you);
  const done = abandoned || typing?.finishedAt != null || (mine !== undefined && mine.status !== 'racing');
  const racing = race !== null && you !== null && phase !== 'finished' && elapsed >= 0 && !timeUp && !done;

  useEffect(() => {
    const timer = setInterval(() => {
      if (outbox.current.length > 0) send({ type: 'keys', strokes: outbox.current.splice(0, MAX_STROKES_PER_BATCH) });
    }, FLUSH_MS);
    return () => clearInterval(timer);
  }, [send]);

  const onKey = (key: string) => {
    const current = typingRef.current;
    if (!current || !racing || startAt === null) return;
    const stroke = { key, t: Math.max(current.lastT, Math.round(Date.now() - startAt)) };
    const next = typeKey(current, stroke);
    outbox.current.push(stroke);
    typingRef.current = next;
    setTyping(next);
  };

  const abandon = () => {
    if (outbox.current.length > 0) send({ type: 'keys', strokes: outbox.current.splice(0) });
    send({ type: 'abandon' });
    setAbandoned(true);
  };

  const confirm = () => {
    if (!pending) return;
    abandon();
    if (pending.kind === 'leave') router.push(pending.href);
    setPending(null);
  };

  const seats = race?.seats ?? [];
  const nameOf = (seat: RacerSeat) => (seat.kind === 'bot' ? tLobby('botName', { number: seat.name }) : seat.name);
  const nameById = (id: string) => {
    const seat = seats.find((s) => s.id === id);
    return seat ? nameOf(seat) : id;
  };

  const bannerText = () => {
    if (!race || elapsed < 0) return t('banner.waiting');
    const { banner } = view;
    if (banner && now - banner.at < BANNER_MS) {
      const names = banner.ids.map(nameById).join(', ');
      if (banner.kind === 'newLeader') return banner.ids[0] === you ? t('banner.youLead') : t('banner.newLeader', { name: names });
      return t(`banner.${banner.kind}`, { names });
    }
    const gap = you ? leaderGap(standings, you) : null;
    if (gap !== null && gap > 0) return t('banner.lead', { gap });
    const leader = standings[0];
    return leader && leader.progress > 0 ? t('banner.leader', { name: nameById(leader.id) }) : '';
  };

  const myElapsed = Math.max(0, Math.min(elapsed, race && race.timerMs > 0 ? race.timerMs : Infinity));
  const score = typing ? typingScore(typing, typing.finishedAt ?? myElapsed) : null;
  const clock = race && race.timerMs > 0 ? formatClock(race.timerMs - myElapsed) : formatClock(myElapsed);

  const rows: SummaryRow[] = standings.map((s) => {
    const seat = seats.find((candidate) => candidate.id === s.id);
    const isYou = s.id === you;
    // Le serveur confirme au tick suivant : en attendant, l'écran montre déjà l'arrivée ou l'abandon.
    const status = isYou && s.status === 'racing' ? (abandoned ? 'abandoned' : typing?.finishedAt != null ? 'finished' : s.status) : s.status;
    return { id: s.id, rank: s.rank, name: seat ? nameOf(seat) : s.id, wpm: s.wpm, accuracy: s.accuracy, status, you: isYou };
  });

  return (
    <>
      <RaceHeader onLeave={racing ? (href) => setPending({ kind: 'leave', href }) : null} />
      <main className="relative w-full flex-1 bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgb(147_0_10/0.32),transparent_70%)]" />
        <div className="relative mx-auto flex max-w-[1100px] flex-col gap-7 px-6 pt-6 pb-16">
          <h1 className="sr-only">{t('title', { name: lobbyName })}</h1>

          {(status !== 'open' || !race) && (
            <p role="status" className="font-label-code flex items-center gap-2 text-[13px] text-tertiary">
              <span aria-hidden="true" className="material-symbols-outlined animate-spin text-[18px] [animation-duration:2s]">progress_activity</span>
              {status === 'lost' ? t('connection.lost') : t('connection.connecting')}
            </p>
          )}

          {race && (
            <>
              <RaceTrack runners={trackRunners(seats, standings, you, race.text.length)} banner={bannerText()} nameOf={nameOf} />

              {you !== null && race.bonus && <EnergyBar energy={mine?.energy ?? 0} />}

              {you !== null && score && (
                <RaceHud
                  wpm={score.wpm}
                  accuracy={score.accuracy}
                  rank={mine?.rank ?? null}
                  total={seats.length}
                  clock={clock}
                  clockLabel={race.timerMs > 0 ? 'remaining' : 'elapsed'}
                  onAbandon={racing ? () => setPending({ kind: 'abandon' }) : null}
                />
              )}

              {you === null && (
                <section aria-labelledby="spectating-title" className="flex items-start gap-4 border-l-[3px] border-secondary bg-secondary-container/20 px-5 py-4">
                  <span aria-hidden="true" className="material-symbols-outlined text-[26px] text-secondary">visibility</span>
                  <div className="flex flex-col gap-1">
                    <h2 id="spectating-title" className="text-[15px] uppercase tracking-[0.14em] text-on-surface">{t('spectator.title')}</h2>
                    <p className="text-on-surface-variant">{t('spectator.body')}</p>
                  </div>
                </section>
              )}

              {(phase === 'finished' || (you !== null && done)) && <RaceSummary rows={rows} you={you} over={phase === 'finished'} lobbyCode={code} />}

              {you !== null && typing && !done && phase !== 'finished' && (
                <div className="relative pt-4">
                  <div className={elapsed < 0 ? 'opacity-40 blur-[2px]' : ''}>
                    <TypingArea text={typing.text} input={typing.input} active={racing} onKey={onKey} />
                  </div>
                  {elapsed < GO_MS && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <Countdown seconds={Math.max(0, Math.ceil(-elapsed / 1000))} />
                    </div>
                  )}
                </div>
              )}

              {you === null && elapsed < 0 && <Countdown seconds={Math.ceil(-elapsed / 1000)} />}
            </>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={pending !== null}
        title={t(pending?.kind === 'leave' ? 'leave.title' : 'abandon.title')}
        body={t(pending?.kind === 'leave' ? 'leave.body' : 'abandon.body')}
        confirmLabel={t(pending?.kind === 'leave' ? 'leave.confirm' : 'abandon.confirm')}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
