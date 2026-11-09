'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DOMAIN_MIN_ENERGY, racerCharacter, type Ability, type CastAbility } from '@/game/abilities';
import { openPrompt, promptKey, type CastPrompt } from '@/game/castPrompt';
import type { CastRefusal } from '@/game/effects';
import { castBlocker, hasCursedEnergy, hasDomain, racerMarks, startPowers, stunnedAt, techniquesOf, type RacerPowers } from '@/game/powers';
import { MAX_STROKES_PER_BATCH, type PlayerSync, type ServerMessage } from '@/game/protocol';
import { leaderGap, type RaceNotice, type RacerSeat } from '@/game/race';
import { acknowledge, addStroke, clearPending, emptyLog, markSent, replay, rewindSent, unsent } from '@/game/strokeLog';
import { startTyping, typeKey, type TypingState } from '@/game/typing';
import { useRouter } from '@/i18n/navigation';
import { claimRaceResultsAction } from '@/app/actions/races';
import AbilityBar from './AbilityBar';
import CastDialog from './CastDialog';
import ChevronButton from '@/components/shared/ChevronButton';
import ConfirmDialog from './ConfirmDialog';
import Countdown from './Countdown';
import RaceLiveStats from './RaceLiveStats';
import DomainBackdrop from './DomainBackdrop';
import EnergyBar from './EnergyBar';
import type { HeaderAccount } from '@/components/layout/ProfileAvatar';
import { useLobbyEvents } from '@/components/lobby/useLobbyEvents';
import RaceHeader from './RaceHeader';
import RaceHud from './RaceHud';
import RaceSummary, { type SummaryRow } from './RaceSummary';
import RaceTrack from './RaceTrack';
import TypingArea from './TypingArea';
import { HIT_MS, formatClock, initialRaceView, laggedInput, raceViewReducer, trackRunners, trimTrail, type TrailEntry } from './raceView';
import { useAbilityNames } from './useAbilityNames';
import { useRaceSocket } from './useRaceSocket';

/** Les frappes partent par lots toutes les 150 ms (RACE-14, TECH-7). */
const FLUSH_MS = 150;
/** Durée d'une annonce de dépassement dans la zone d'animation. */
const BANNER_MS = 2500;
/** Le « Partez ! » reste affiché un instant après le départ. */
const GO_MS = 800;

type Pending = { kind: 'abandon' } | { kind: 'leave'; href: string } | null;
/** Pourquoi un lancement n'a pas eu lieu, montré un instant dans la zone d'animation. */
type CastNote = { reason: CastRefusal | 'failed'; at: number };
const castNoteNow = (reason: CastNote['reason']): CastNote => ({ reason, at: Date.now() });

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
// `live` (lobby créé) : l'écran garde aussi la place du joueur dans le lobby, pour le retrouver après la course.
export default function RaceScreen({
  code,
  lobbyName,
  account = null,
  live = false,
  ticket,
}: {
  code: string;
  lobbyName: string;
  account?: HeaderAccount | null;
  live?: boolean;
  ticket?: string;
}) {
  const t = useTranslations('Race');
  const tLobby = useTranslations('Lobby.participants');
  const names = useAbilityNames();
  const router = useRouter();
  const [view, setView] = useState(initialRaceView);
  const [typing, setTyping] = useState<TypingState | null>(null);
  const [abandoned, setAbandoned] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  // Dernière frappe du joueur : son personnage court tant qu'il tape.
  const [typedAt, setTypedAt] = useState<number | null>(null);
  const [powers, setPowers] = useState<RacerPowers>(startPowers);
  // Fenêtre de lancement : ouverte, elle reçoit les touches à la place du texte.
  const [prompt, setPrompt] = useState<CastPrompt<CastAbility> | null>(null);
  const [castNote, setCastNote] = useState<CastNote | null>(null);
  // Sous Poing divergent : les frappes récentes, pour les afficher en retard.
  const [trail, setTrail] = useState<TrailEntry[]>([]);
  // La saisie et les frappes à envoyer vivent aussi dans des refs : plusieurs touches peuvent arriver dans le même événement.
  const typingRef = useRef<TypingState | null>(null);
  const strokes = useRef(emptyLog());
  const powersRef = useRef(powers);
  const promptRef = useRef(prompt);

  const showTyping = (next: TypingState | null) => {
    typingRef.current = next;
    setTyping(next);
  };

  const showPrompt = (next: CastPrompt<CastAbility> | null) => {
    promptRef.current = next;
    setPrompt(next);
  };

  const showPowers = (next: RacerPowers) => {
    powersRef.current = next;
    setPowers(next);
  };

  // La room a changé la saisie ou les états du joueur : on repart de sa version et on rejoue ce qu'elle n'a pas encore reçu.
  const syncPlayer = ({ typing: server, acked, powers: next }: PlayerSync) => {
    strokes.current = acknowledge(strokes.current, acked);
    showPowers(next);
    showTyping(replay(server, strokes.current, next));
    // Un étourdissement interrompt le lancement, sans rien coûter.
    if (promptRef.current && view.startAt !== null && stunnedAt(next, Date.now() - view.startAt)) showPrompt(null);
  };

  const { status, send } = useRaceSocket(code, (message: ServerMessage) => {
    const receivedAt = Date.now();
    setView((current) => raceViewReducer(current, message, receivedAt));
    if (message.type === 'welcome') {
      setAbandoned(false);
      const acked = message.acked ?? 0;
      showPrompt(null);
      if (message.you !== null && message.you === view.you && message.typing) {
        // Retour après une coupure, sur le même siège : ce que la room n'a pas confirmé est rejoué sur sa saisie, puis renvoyé.
        strokes.current = rewindSent(acknowledge(strokes.current, acked));
        syncPlayer({ typing: message.typing, acked, powers: message.powers ?? powersRef.current });
      } else {
        strokes.current = emptyLog(acked);
        showPowers(message.powers ?? startPowers());
        showTyping(message.you ? (message.typing ?? startTyping(message.race.text, message.race.mode)) : null);
      }
    }
    if (message.type === 'sync') syncPlayer(message);
    if (message.type === 'resync') {
      strokes.current = clearPending(strokes.current);
      showPowers(message.powers);
      showTyping(message.typing);
    }
    if (message.type === 'castRefused') setCastNote({ reason: message.reason, at: receivedAt });
  }, ticket);

  useLobbyEvents(live ? code : null, () => {}, () => {});

  const { race, you, startAt, phase, standings } = view;
  const now = useNow(100, race !== null && phase !== 'finished');
  const elapsed = startAt === null ? -Infinity : now - startAt;
  const timeUp = race !== null && race.timerMs > 0 && elapsed >= race.timerMs;
  const mine = standings.find((s) => s.id === you);
  const done = abandoned || typing?.finishedAt != null || (mine !== undefined && mine.status !== 'racing');
  const racing = race !== null && you !== null && phase !== 'finished' && elapsed >= 0 && !timeUp && !done;

  const mySeat = race?.seats.find((seat) => seat.id === you);
  const character = mySeat ? racerCharacter(mySeat) : null;
  const caster = character && race ? { character, energy: mine?.energy ?? 0, powers, gameMode: race.gameMode } : null;
  const blockerOf = (ability: CastAbility) => (caster ? castBlocker(caster, ability, elapsed) : 'none');
  const techniques = character ? techniquesOf(character) : [];
  const castableTechniques = techniques.filter(({ id }) => blockerOf(id) === null);

  // Un invité assis dans un lobby créé : la room a gardé son résultat, il le réclame pour son cookie (STAT-6).
  // Un compte n'a rien à faire, la room l'a déjà écrit en base (STAT-8).
  const claimed = useRef(false);
  const claimResult = live && account === null && you !== null && phase === 'finished';
  useEffect(() => {
    if (!claimResult || claimed.current) return;
    claimed.current = true;
    void claimRaceResultsAction();
  }, [claimResult]);

  // Un lot ne quitte la file qu'une fois parti : pendant une coupure, les frappes attendent la reconnexion.
  const flush = useCallback(() => {
    for (let batch = unsent(strokes.current, MAX_STROKES_PER_BATCH); batch; batch = unsent(strokes.current, MAX_STROKES_PER_BATCH)) {
      if (!send({ type: 'keys', ...batch })) return;
      strokes.current = markSent(strokes.current, batch.seq);
    }
  }, [send]);

  useEffect(() => {
    const timer = setInterval(flush, FLUSH_MS);
    return () => clearInterval(timer);
  }, [flush]);

  // Les frappes d'abord : la room doit lancer depuis la position que le joueur voit.
  const cast = (ability: CastAbility) => {
    flush();
    send({ type: 'cast', ability });
  };

  const onCastKey = (current: CastPrompt<CastAbility>, key: string) => {
    const step = promptKey(current, key);
    showPrompt(step.status === 'open' ? step.prompt : null);
    if (step.status === 'cast') cast(step.id);
    if (step.status === 'failed') setCastNote(castNoteNow('failed'));
  };

  const onKey = (key: string) => {
    if (promptRef.current) {
      if (racing) onCastKey(promptRef.current, key);
      return;
    }
    const current = typingRef.current;
    if (!current || !racing || startAt === null) return;
    const at = Date.now();
    const stroke = { key, t: Math.max(current.lastT, Math.round(at - startAt)) };
    if (stunnedAt(powersRef.current, stroke.t)) return;
    const next = typeKey(current, stroke);
    strokes.current = addStroke(strokes.current, stroke);
    showTyping(next);
    setTypedAt(at);
    if (powersRef.current.lagUntil > stroke.t) setTrail((entries) => [...trimTrail(entries, at), { at, before: current.input, input: next.input }]);
  };

  const castName = (id: CastAbility) => {
    if (id === 'mahoraga') return t('cast.mahoraga');
    if (id === 'domain') return character && hasDomain(character) ? names.domain(character) : '';
    return id === 'vow' ? '' : names.technique(id);
  };

  const onAbility = (ability: Ability) => {
    if (!racing || promptRef.current || !caster) return;
    if (ability === 'vow') {
      const blocker = blockerOf('vow');
      if (blocker) setCastNote(castNoteNow(blocker));
      else cast('vow');
      return;
    }
    const ids: CastAbility[] = ability === 'technique' ? castableTechniques.map(({ id }) => id) : blockerOf('domain') === null ? ['domain'] : [];
    if (ids.length > 0) showPrompt(openPrompt(ability, ids.map((id) => ({ id, name: castName(id) }))));
    else setCastNote(castNoteNow(blockerOf(ability === 'domain' ? 'domain' : (techniques[0]?.id ?? 'domain')) ?? 'none'));
  };

  const abandon = () => {
    flush();
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
  const nameOf = (seat: RacerSeat) => (seat.kind === 'bot' && !seat.summon ? tLobby('botName', { number: seat.name }) : seat.name);
  const nameById = (id: string) => {
    const seat = seats.find((s) => s.id === id);
    return seat ? nameOf(seat) : id;
  };

  const noticeText = (notice: RaceNotice) => {
    const name = nameById(notice.by);
    switch (notice.kind) {
      case 'cast': {
        const values = { name, ability: names.technique(notice.ability), target: notice.target ? nameById(notice.target) : '' };
        return t(`notices.${notice.outcome}`, values);
      }
      case 'domain':
        return t(notice.open ? 'notices.domainOpen' : 'notices.domainClose', { name, domain: names.domain(notice.character) });
      case 'blackFlash':
        return t('notices.blackFlash', { name, target: nameById(notice.target) });
      case 'vow':
        return t('notices.vow', { name });
      case 'summon':
        return t('notices.summon', { name });
    }
  };

  const bannerText = () => {
    if (!race || elapsed < 0) return t('banner.waiting');
    const winner = standings[0];
    if (phase === 'finished' && winner) return winner.id === you ? t('banner.youWin') : t('banner.winner', { name: nameById(winner.id) });
    if (castNote && now - castNote.at < BANNER_MS) return castNote.reason === 'failed' ? t('cast.failed') : t(`cast.blocked.${castNote.reason}`);
    if (view.notice && now - view.notice.at < BANNER_MS) return noticeText(view.notice.notice);
    const { banner } = view;
    if (banner && now - banner.at < BANNER_MS) {
      const names = banner.ids.map(nameById).join(', ');
      if (banner.kind === 'newLeader') return banner.ids[0] === you ? t('banner.youLead') : t('banner.newLeader', { name: names });
      return t(`banner.${banner.kind}`, { names });
    }
    const gap = you && !done ? leaderGap(standings, you) : null;
    if (gap !== null && gap > 0) return t('banner.lead', { gap });
    const leader = standings[0];
    return leader && leader.progress > 0 ? t('banner.leader', { name: nameById(leader.id) }) : '';
  };

  // Le chrono du joueur s'arrête à son arrivée.
  const clockMs = typing?.finishedAt ?? Math.max(0, elapsed);
  const clock = race && race.timerMs > 0 ? formatClock(race.timerMs - clockMs) : null;

  const castCost = (id: CastAbility) => {
    const technique = techniques.find((candidate) => candidate.id === id);
    if (!technique) return t('cast.domainCost', { cost: DOMAIN_MIN_ENERGY });
    return t(technique.spendsAll ? 'cast.costAll' : 'cast.costValue', { cost: technique.cost });
  };

  const hasEnergy = race !== null && race.bonus && character !== null && hasCursedEnergy(character);
  const abilityList: { ability: Ability; ready: boolean }[] = [
    ...(character && hasDomain(character) && race?.gameMode !== 'noDomain' ? [{ ability: 'domain' as const, ready: racing && blockerOf('domain') === null }] : []),
    { ability: 'technique', ready: racing && castableTechniques.length > 0 },
    { ability: 'vow', ready: racing && blockerOf('vow') === null },
  ];
  // Une course finie ferme tout : la room n'annonce pas les territoires encore ouverts à l'arrivée.
  const domainOwner = phase === 'finished' ? null : (Object.values(view.domains)[0] ?? null);
  const hits = view.hits.filter((hit) => now - hit.at < HIT_MS);
  const stunned = racing && stunnedAt(powers, elapsed);
  const shownInput = typing && powers.lagUntil > elapsed ? laggedInput(trail, now, typing.input) : typing?.input;

  const rows: SummaryRow[] = standings.map((s) => {
    const seat = seats.find((candidate) => candidate.id === s.id);
    const isYou = s.id === you;
    // Le serveur confirme au tick suivant : en attendant, l'écran montre déjà l'arrivée ou l'abandon.
    const status = isYou && s.status === 'racing' ? (abandoned ? 'abandoned' : typing?.finishedAt != null ? 'finished' : s.status) : s.status;
    return {
      id: s.id,
      rank: s.rank,
      name: seat ? nameOf(seat) : s.id,
      avatar: seat?.avatar ?? null,
      photo: seat?.photo ?? null,
      wpm: s.wpm,
      rawWpm: s.rawWpm,
      accuracy: s.accuracy,
      errors: s.errors,
      endedAt: s.endedAt,
      received: s.received,
      status,
      you: isYou,
      bot: seat?.kind === 'bot',
    };
  });

  return (
    <>
      <RaceHeader account={account} onLeave={racing ? (href) => setPending({ kind: 'leave', href }) : null} />
      <main id="main" className="relative w-full flex-1 bg-surface">
        {domainOwner && <DomainBackdrop domain={domainOwner} />}
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
              <RaceTrack
                runners={trackRunners(seats, standings, you, race.text.length, { now, movedAt: view.movedAt, youTypedAt: typedAt })}
                banner={bannerText()}
                nameOf={nameOf}
                hits={hits}
                domainOpen={domainOwner !== null}
              />

              {you !== null && (
                <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
                  <RaceLiveStats wpm={mine?.wpm ?? 0} accuracy={mine?.accuracy ?? 1} />
                  {hasEnergy && (
                    <div className="min-w-60 flex-1">
                      <EnergyBar energy={mine?.energy ?? 0} character={character} />
                    </div>
                  )}
                  {clock && <RaceHud clock={clock} />}
                </div>
              )}
              {you !== null && hasEnergy && !done && <AbilityBar abilities={abilityList} marks={racerMarks(powers, elapsed)} onUse={onAbility} />}

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
                  <div>
                    <TypingArea text={typing.text} input={shownInput ?? typing.input} active={racing} casting={prompt !== null} onKey={onKey} onAbility={onAbility} />
                  </div>
                  {stunned && (
                    <p role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface/70 text-[22px] uppercase tracking-[0.2em] text-primary backdrop-blur-[2px]">
                      {t('typing.stunned')}
                    </p>
                  )}
                  {elapsed < GO_MS && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <Countdown seconds={Math.max(0, Math.ceil(-elapsed / 1000))} />
                    </div>
                  )}
                </div>
              )}

              {racing && (
                <div className="flex justify-end">
                  <ChevronButton type="button" size="sm" chevrons={false} onClick={() => setPending({ kind: 'abandon' })} className="font-label-code text-[11px] uppercase tracking-[0.16em]">
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">flag</span>
                    {t('hud.abandon')}
                  </ChevronButton>
                </div>
              )}

              {you === null && elapsed < 0 && <Countdown seconds={Math.ceil(-elapsed / 1000)} />}
            </>
          )}
        </div>
      </main>

      {prompt && racing && <CastDialog prompt={prompt} costOf={castCost} />}

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
