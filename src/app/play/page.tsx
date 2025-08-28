// src/app/play/page.tsx
'use client';

import { useEffect, useReducer, useState, useRef, useCallback } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import TimerBar from '@/components/ui/TimerBar';
import HUD from '@/components/ui/HUD';
import { GLYPHS, GlyphId } from '@/config/glyphs';
import {
    gameReducer,
    initialState,
    ENERGY_DECAY_PER_SEC,
} from '@/state/gameState';
import { showTimeMsForLevel } from '@/lib/difficulty';
import { playSfx, setSfxArmed } from '@/lib/audio';
import { saveHighscore, saveLastResult } from '@/lib/storage/highscores';
import { accuracy as accPct } from '@/state/selectors';
import { buzzOk, buzzBad } from '@/lib/haptics';
import TopControlBar from '@/components/ui/TopControlBar';
import GameModal from '@/components/ui/GameModal';

export default function PlayPage() {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    /** Keep pause state in a ref to freeze async loops */
    const pausedRef = useRef(state.paused);
    useEffect(() => { pausedRef.current = state.paused; }, [state.paused]);

    /** Sequence playback index (visual only) */
    const [seqIdx, setSeqIdx] = useState(-1);
    const isShowing = state.phase === 'showingSequence';
    const canClick = !state.paused && isShowing && seqIdx >= 0;

    /** Damage FX nonce (updates on every miss/omission) */
    const [damageStamp, setDamageStamp] = useState<number>(0);

    /** Legacy visual progress (kept for compatibility with TimerBar) */
    const [progress, setProgress] = useState(1);

    /** Modal flow */
    const [modalOpen, setModalOpen] = useState(false);
    const [modalStage, setModalStage] = useState<'countdown' | 'live'>('countdown');
    const [startBusy, setStartBusy] = useState(false);

    /** Arm/disarm SFX only when user taps are valid (no sounds while auto-playing). */
    useEffect(() => {
        setSfxArmed(!!canClick);
        return () => setSfxArmed(false);
    }, [canClick]);

    /** Energy decay loop (softer while revealing sequence). */
    useEffect(() => {
        if (!modalOpen || modalStage !== 'live' || state.phase === 'fail' || state.paused) return;
        let raf = 0;
        let last = performance.now();
        const tick = (now: number) => {
            if (pausedRef.current) return;
            const dt = Math.max(0, (now - last) / 1000);
            last = now;
            const phaseFactor = state.phase === 'showingSequence' ? 0.5 : 1;
            dispatch({ type: 'ENERGY_DELTA', delta: -ENERGY_DECAY_PER_SEC * phaseFactor * dt });
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [modalOpen, modalStage, state.phase, state.paused]);

    /**
     * Reveal sequence (lights only, no SFX).
     * New: when each lit window ends, if that index was NOT tapped, dispatch LIVE_MISS.
     */
    useEffect(() => {
        let stop = false;
        async function playSequence() {
            if (state.paused) return;
            setSeqIdx(-1);
            const per = showTimeMsForLevel(state.level);
            await new Promise((r) => setTimeout(r, 400));
            for (let i = 0; i < state.sequence.length; i++) {
                if (stop || pausedRef.current) return;
                setSeqIdx(i);

                // (No auto SFX while revealing)
                await new Promise((r) => setTimeout(r, Math.max(200, per - 120)));
                if (stop || pausedRef.current) return;

                // If this index wasn't tapped while lit → omission miss
                if (!state.liveHits[i]) {
                    setDamageStamp(Date.now());                 // 🔴 trigger damage FX
                    dispatch({ type: 'LIVE_MISS', idx: i });
                }

                setSeqIdx(-1);
                await new Promise((r) => setTimeout(r, 140));
            }
            if (!stop && !pausedRef.current) dispatch({ type: 'SEQ_SHOWN' });
        }
        if (isShowing && state.sequence.length > 0) void playSequence();
        return () => { stop = true; };
        // include liveHits so the loop checks the current tap state for each index
    }, [isShowing, state.sequence, state.level, state.paused, state.liveHits]);

    /** Visual timer bar (not used to end the game). */
    useEffect(() => {
        if (state.phase !== 'awaitingInput' || !state.roundStartMs || !state.roundTotalMs) {
            setProgress(1);
            return;
        }
        let raf = 0;
        const tick = () => {
            if (pausedRef.current) { raf = requestAnimationFrame(tick); return; }
            const now = Date.now();
            const end = state.roundStartMs! + state.roundTotalMs!;
            const rem = Math.max(0, end - now);
            setProgress(rem / state.roundTotalMs!);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [state.phase, state.roundStartMs, state.roundTotalMs]);

    /** Start → open modal, prefill energy, then countdown → live → START action. */
    function handleStart() {
        if (startBusy) return;
        setStartBusy(true);
        setModalStage('countdown');
        setModalOpen(true);
        dispatch({ type: 'ENERGY_SET', value: 1 });
    }
    function handleCountdownComplete() {
        setModalStage('live');
        setTimeout(() => {
            dispatch({ type: 'START' });
            setStartBusy(false);
        }, 100);
    }

    /** End-game wrapped in useCallback so effects can depend on it safely. */
    const endGame = useCallback(() => {
        const a = accPct(state.correctTotal, state.playedTotal);
        const result = {
            score: state.score,
            accuracy: a,
            level: state.level,
            streakMax: state.streakMax,
            ts: Date.now(),
        };
        saveLastResult(result);
        saveHighscore(result);
        setModalOpen(false);
        setTimeout(() => { window.location.href = '/results'; }, 650);
    }, [state.correctTotal, state.playedTotal, state.score, state.level, state.streakMax]);

    /** Player taps (SFX only on user input). */
    function handleGlyph(id: GlyphId) {
        if (state.paused) return;
        const isLive = state.phase === 'showingSequence' && seqIdx >= 0;
        if (!isLive) return;

        const expected = state.sequence[seqIdx];
        const ok = id === expected;

        const g = GLYPHS.find((x) => x.id === id);
        if (g) playSfx(g.sfx);
        if (ok) buzzOk(); else { buzzBad(); setDamageStamp(Date.now()); } // 🔴 damage on wrong tap

        dispatch({ type: 'LIVE_HIT', ok, idx: seqIdx, glyph: id, now: Date.now() });
    }

    /** Round progression and end-game. */
    useEffect(() => {
        if (state.phase === 'success') {
            const t = setTimeout(() => dispatch({ type: 'ROUND_SUCCESS', now: Date.now() }), 450);
            return () => clearTimeout(t);
        }
        if (state.phase === 'fail') {
            endGame();
        }
    }, [state.phase, dispatch, endGame]);

    /** Copy for status/help */
    const statusText =
        state.phase === 'intro'
            ? 'Ready to start…'
            : state.phase === 'showingSequence'
                ? 'Wave in progress…'
                : state.phase === 'awaitingInput'
                    ? 'Your turn!'
                    : state.phase === 'success'
                        ? 'Good! Next wave…'
                        : state.phase === 'fail'
                            ? 'Wave failed'
                            : 'Ready';

    const helpText = (
        <>
            <strong>Goal:</strong> Keep your energy up by hitting the lit glyph quickly.
            <br />
            Hits restore a bit of energy and build combo; misses drain more — keep the chain alive!
        </>
    );

    const highlightedId: GlyphId | null = canClick ? state.sequence[seqIdx] : null;

    return (
        <main className="min-h-screen text-white witcher-app">
            <AppHeader />
            {/* offset for fixed header */}
            <div className="h-16 md:h-20" />

            <section className="mx-auto play-wrap px-4 md:px-6 py-6 md:py-8 space-y-6">
                {/* Top HUD inside a glass/metal frame */}
                <div className="witcher-panel p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* State badge + quick status */}
                        <div className="flex items-center gap-3">
                            <div className="rounded-full border border-[rgba(212,175,55,.35)] px-3 py-1 text-xs text-[color:var(--fx-gold)]">
                                {state.phase === 'intro' ? 'Idle' : state.phase}
                            </div>
                            <div className="text-sm text-[color:var(--fx-steel)]">{statusText}</div>
                        </div>

                        {/* Start / Pause */}
                        <TopControlBar
                            status={statusText}
                            helpText={helpText}
                            onStart={handleStart}
                            startDisabled={startBusy || !(state.phase === 'intro' || state.phase === 'awaitingInput')}
                        />
                    </div>

                    {/* Energy / time bar */}
                    <div className="mt-4">
                        <TimerBar progress={progress} paused={state.paused} />
                    </div>
                </div>

                {/* On-screen hint under the panel */}
                <div className="grid place-items-center h-6">
                    <span
                        className="text-sm"
                        style={{
                            color: 'rgba(212,175,55,.9)',
                            opacity: state.phase === 'showingSequence' ? 1 : 0,
                            transition: 'opacity 160ms',
                        }}
                    >
                        Tap the glyph when it lights up!
                    </span>
                </div>

                {/* Bottom HUD (score, level, combo, etc.) */}
                <HUD state={state.phase} />
            </section>

            {/* Main game modal (countdown → live) */}
            <GameModal
                open={modalOpen}
                stage={modalStage}
                seconds={3}
                activeId={highlightedId}
                canClick={canClick}
                energy={state.energy}
                onGlyph={handleGlyph}
                onCountdownDone={handleCountdownComplete}
                onSurrender={endGame}
                score={state.score}
                level={state.level}
                streak={state.streak}
                mult={1 + Math.floor(state.streak / 5)}
                paused={state.paused}
                onTogglePause={() => dispatch({ type: 'TOGGLE_PAUSED' })}
                damageStamp={damageStamp}
            />
        </main>
    );
}
