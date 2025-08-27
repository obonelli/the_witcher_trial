// Difficulty curve tuning: sequence length, reveal speed, input window, fakes

// Central knobs so you can tweak quickly
export const DIFFICULTY = {
    // Reveal time per glyph (ms)
    show: {
        easy: 900,     // levels 1–3
        medium: 750,   // levels 4–6
        hard: 620,     // levels 7–9
        endlessMin: 380, // minimum at very high levels
        stepEndless: 20, // reduce per level after 10 (clamped by endlessMin)
    },

    // Input window = factor * (show time * sequence length), clamped
    input: {
        perGlyphFactor: 1.25, // generous reaction time vs reveal speed
        minMs: 3500,
        maxMs: 12000,
    },

    // Fake tiles (visual distractors, not clickable)
    fakes: {
        startAtLevel: 7,
        stepLevels: 2,     // +1 fake every 2 levels after start
        maxFakes: 4,
    },

    // Sequence length growth
    seq: {
        L1_3: [3, 4, 5],   // explicit for early clarity
        L4_6: [5, 6, 7],
        L7_9: [7, 8, 9],
        // after level 10 -> +1 length every 2 levels, starting from 10
        baseAfter9: 10,
    },
};

// --- Sequence length ---

export function sequenceLengthForLevel(level: number): number {
    if (level <= 0) return 3;

    if (level <= 3) return DIFFICULTY.seq.L1_3[level - 1];
    if (level <= 6) return DIFFICULTY.seq.L4_6[level - 4];
    if (level <= 9) return DIFFICULTY.seq.L7_9[level - 7];

    // Endless: +1 every 2 levels after level 10; base 10
    const extra = Math.floor((level - 10) / 2) + 0; // +0 at 10–11, +1 at 12–13, etc.
    return DIFFICULTY.seq.baseAfter9 + Math.max(0, extra);
}

// --- Reveal (show) time per glyph ---

export function showTimeMsForLevel(level: number): number {
    if (level <= 3) return DIFFICULTY.show.easy;
    if (level <= 6) return DIFFICULTY.show.medium;
    if (level <= 9) return DIFFICULTY.show.hard;

    // Endless ramp-down
    const raw = DIFFICULTY.show.hard - (level - 9) * DIFFICULTY.show.stepEndless;
    return Math.max(DIFFICULTY.show.endlessMin, raw);
}

// --- Input window for the round (progress bar timing) ---

export function inputWindowMs(level: number, seqLen: number): number {
    const perGlyph = showTimeMsForLevel(level);
    const raw = Math.round(perGlyph * DIFFICULTY.input.perGlyphFactor * seqLen);
    return Math.max(DIFFICULTY.input.minMs, Math.min(DIFFICULTY.input.maxMs, raw));
}

// --- Number of fake tiles for the current level ---

export function fakeCountForLevel(level: number): number {
    if (level < DIFFICULTY.fakes.startAtLevel) return 0;
    const steps = Math.floor((level - DIFFICULTY.fakes.startAtLevel) / DIFFICULTY.fakes.stepLevels) + 1;
    return Math.min(DIFFICULTY.fakes.maxFakes, steps);
}
