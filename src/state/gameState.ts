// Game state + reducer (difficulty curve tuned via lib/difficulty.ts)
// NOTE: keep all code comments in English.

import { GamePhase } from '@/config/gameConfig';
import { GlyphId, GLYPHS } from '@/config/glyphs';
import { mulberry32 } from '@/lib/rng';
import { streakMultiplier, speedBonus, calcRoundScore } from '@/lib/scoring';
import { sequenceLengthForLevel, inputWindowMs, ROUNDS_PER_LEVEL } from '@/lib/difficulty';

/**
 * Energy gameplay tuning (exported so UI can reuse them if needed)
 * Adjust these to change survivability. Higher decay = harsher.
 */
export const ENERGY_END_THRESH = 0.35;    // game over only under 35%
export const ENERGY_GAIN_ON_HIT = 0.09;   // energy gained per correct tap
export const ENERGY_LOSS_ON_MISS = 0.12;  // energy lost per wrong tap
export const ENERGY_DECAY_PER_SEC = 0.12; // continuous decay while playing (↑ to drop faster)

export type GameState = {
    phase: GamePhase;
    level: number;

    /**
     * Successful rounds completed at the current level.
     * When this reaches ROUNDS_PER_LEVEL, we increment the level and reset this counter.
     */
    roundsAtLevel: number;

    sequence: GlyphId[];
    inputIndex: number; // kept for backward-compat, unused in live-tap mode
    score: number;
    streak: number;
    streakMax: number;
    correctTotal: number;
    playedTotal: number;
    seed: number;
    roundStartMs?: number;
    roundTotalMs?: number; // total available time for INPUT (classic mode)
    /** Indices in the current sequence already tapped while it was showing (live-tap mode). */
    liveHits: boolean[];

    /** Energy meter (0..1). Game ends when below ENERGY_END_THRESH. */
    energy: number;
    /** Optional end reason for telemetry/UI. */
    endReason?: 'energy' | 'other';

    /** Global pause flag (freezes sequence playback, inputs and energy decay). */
    paused: boolean;
};

export const initialState: GameState = {
    phase: 'intro',
    level: 1,
    roundsAtLevel: 0,
    sequence: [],
    inputIndex: 0,
    score: 0,
    streak: 0,
    streakMax: 0,
    correctTotal: 0,
    playedTotal: 0,
    seed: 12345,
    liveHits: [],
    energy: 1,
    paused: false,
};

export type GameEvent =
    | { type: 'START' }
    | { type: 'SET_SEQUENCE'; sequence: GlyphId[] }
    | { type: 'SEQ_SHOWN' }
    | { type: 'INPUT'; glyph: GlyphId; now: number } // classic mode (kept for compatibility)
    | { type: 'LIVE_HIT'; ok: boolean; idx: number; glyph: GlyphId; now: number } // live-tap mode
    | { type: 'ROUND_SUCCESS'; now: number }
    | { type: 'ROUND_FAIL' }
    | { type: 'TIMEOUT' }
    | { type: 'RETRY' }
    | { type: 'GAME_OVER' }
    // Energy control from UI loops (decay / reset at start)
    | { type: 'ENERGY_SET'; value: number }
    | { type: 'ENERGY_DELTA'; delta: number }
    // Pause control
    | { type: 'SET_PAUSED'; value: boolean }
    | { type: 'TOGGLE_PAUSED' };

/** Deterministic sequence generator (seeded) */
export function generateSequence(level: number, seed: number): GlyphId[] {
    const len = sequenceLengthForLevel(level);
    const rand = mulberry32(seed + level * 1337);
    const ids = GLYPHS.map((g) => g.id);
    const seq: GlyphId[] = [];
    for (let i = 0; i < len; i++) {
        const idx = Math.floor(rand() * ids.length);
        seq.push(ids[idx] as GlyphId);
    }
    return seq;
}

export function gameReducer(state: GameState, ev: GameEvent): GameState {
    switch (ev.type) {
        case 'SET_PAUSED':
            return { ...state, paused: ev.value };
        case 'TOGGLE_PAUSED':
            return { ...state, paused: !state.paused };

        case 'START': {
            // Do NOT end the game by energy here; the page sets energy to 1
            const seq = generateSequence(state.level, state.seed);
            return {
                ...state,
                phase: 'showingSequence',
                sequence: seq,
                inputIndex: 0,
                roundStartMs: undefined,
                // Keep this around (not used in live-tap, but harmless)
                roundTotalMs: inputWindowMs(state.level, seq.length),
                // Reset live-tap hits for this round
                liveHits: new Array(seq.length).fill(false),
                endReason: undefined,
            };
        }

        case 'SET_SEQUENCE':
            return { ...state, sequence: ev.sequence };

        /**
         * End of "showingSequence".
         * In energy mode there is NO fail here if some indices weren't tapped.
         * We award score based on number of indices successfully tapped while lit,
         * and then wait for an explicit ROUND_SUCCESS or continue flow from the page.
         */
        case 'SEQ_SHOWN': {
            const hits = state.liveHits.filter(Boolean).length;
            const perfect = hits === state.sequence.length;

            const mult = streakMultiplier(state.streak);
            const spd = speedBonus(0, state.roundTotalMs ?? 0, 50); // effectively 0
            const roundScore = calcRoundScore({
                correctCount: hits,
                perGlyph: 10,
                streakMult: mult,
                speed: spd,
                perfectBonus: perfect ? 100 : 0,
            });

            return {
                ...state,
                phase: 'success',
                score: state.score + roundScore,
                // played/correct totals were updated incrementally in LIVE_HIT
            };
        }

        // Legacy INPUT (classic repeat mode) – unused in live-tap
        case 'INPUT': {
            if (state.phase !== 'awaitingInput') return state;

            const expected = state.sequence[state.inputIndex];
            const playedTotal = state.playedTotal + 1;
            const correct = ev.glyph === expected;
            const correctTotal = state.correctTotal + (correct ? 1 : 0);

            if (!correct) {
                return { ...state, phase: 'fail', playedTotal, correctTotal, streak: 0, endReason: 'other' };
            }

            const nextIndex = state.inputIndex + 1;
            const streak = state.streak + 1;
            const streakMax = Math.max(state.streakMax, streak);

            if (nextIndex >= state.sequence.length) {
                const roundTotalMs = state.roundTotalMs ?? 0;
                const timeRemainingMs = Math.max(0, (state.roundStartMs ?? ev.now) + roundTotalMs - ev.now);
                const mult = streakMultiplier(streak);
                const spd = speedBonus(timeRemainingMs, roundTotalMs, 50);
                const roundScore = calcRoundScore({
                    correctCount: state.sequence.length,
                    perGlyph: 10,
                    streakMult: mult,
                    speed: spd,
                    perfectBonus: 100,
                });

                return {
                    ...state,
                    phase: 'success',
                    inputIndex: nextIndex,
                    streak,
                    streakMax,
                    playedTotal,
                    correctTotal,
                    score: state.score + roundScore,
                };
            }

            return { ...state, inputIndex: nextIndex, streak, streakMax, playedTotal, correctTotal };
        }

        /**
         * LIVE_HIT (tap while the glyph is currently lit).
         * In energy mode:
         *  - Wrong: decrease energy, reset streak; DO NOT fail immediately unless under threshold.
         *  - Correct (and first time on this index): mark, increase streak/counters, increase energy.
         */
        case 'LIVE_HIT': {
            if (state.phase !== 'showingSequence') return state;
            if (state.paused) return state; // ignore inputs while paused

            const { ok, idx } = ev;

            // Ignore duplicates on the same index (prevents streak/counter abuse)
            if (ok && state.liveHits[idx]) {
                return state;
            }

            const playedTotal = state.playedTotal + 1;

            if (!ok) {
                // wrong tap → energy penalty + streak reset
                const nextEnergy = Math.max(0, Math.min(1, state.energy - ENERGY_LOSS_ON_MISS));
                const fail = nextEnergy < ENERGY_END_THRESH;
                return {
                    ...state,
                    playedTotal,
                    streak: 0,
                    energy: nextEnergy,
                    phase: fail ? 'fail' : state.phase,
                    endReason: fail ? 'energy' : state.endReason,
                };
            }

            // correct
            const liveHits = state.liveHits.slice();
            liveHits[idx] = true;

            const streak = state.streak + 1;
            const streakMax = Math.max(state.streakMax, streak);
            const correctTotal = state.correctTotal + 1;

            const nextEnergy = Math.max(0, Math.min(1, state.energy + ENERGY_GAIN_ON_HIT));
            const fail = nextEnergy < ENERGY_END_THRESH;

            return {
                ...state,
                liveHits,
                streak,
                streakMax,
                playedTotal,
                correctTotal,
                energy: nextEnergy,
                phase: fail ? 'fail' : state.phase,
                endReason: fail ? 'energy' : state.endReason,
            };
        }

        case 'ROUND_SUCCESS': {
            // Slower level-up: require multiple successes before incrementing the level.
            const nextRoundsAtLevel = state.roundsAtLevel + 1;
            const shouldLevelUp = nextRoundsAtLevel >= ROUNDS_PER_LEVEL;

            const nextLevel = shouldLevelUp ? state.level + 1 : state.level;
            const newRoundsAtLevel = shouldLevelUp ? 0 : nextRoundsAtLevel;

            const seq = generateSequence(nextLevel, state.seed);
            return {
                ...state,
                level: nextLevel,
                roundsAtLevel: newRoundsAtLevel,
                phase: 'showingSequence',
                sequence: seq,
                inputIndex: 0,
                roundStartMs: undefined,
                roundTotalMs: inputWindowMs(nextLevel, seq.length),
                liveHits: new Array(seq.length).fill(false), // reset per round
            };
        }

        case 'ROUND_FAIL':
            return { ...state, phase: 'fail', endReason: 'other' };

        case 'TIMEOUT':
            // Timeouts only apply to classic mode. In energy flow we ignore them.
            return state;

        case 'RETRY':
            // Reset state and bump seed for variety
            return { ...initialState, seed: state.seed + 1 };

        case 'GAME_OVER':
            return { ...state, phase: 'gameOver' };

        // ─────── ENERGY control from the page (decay / reset) ───────
        case 'ENERGY_SET': {
            const e = Math.max(0, Math.min(1, ev.value));
            const fail = e < ENERGY_END_THRESH;
            return {
                ...state,
                energy: e,
                phase: fail ? 'fail' : state.phase,
                endReason: fail ? 'energy' : state.endReason,
            };
        }

        case 'ENERGY_DELTA': {
            // If paused, ignore external decay/gain (keeps energy frozen)
            if (state.paused) return state;
            const e = Math.max(0, Math.min(1, state.energy + ev.delta));
            const fail = e < ENERGY_END_THRESH;
            return {
                ...state,
                energy: e,
                phase: fail ? 'fail' : state.phase,
                endReason: fail ? 'energy' : state.endReason,
            };
        }

        default:
            return state;
    }
}
