export const GAME_CONFIG = {
    baseShowMs: 1000, // time per glyph in ms (low level)
    baseInputMs: 1000, // time per input in ms
    endlessLenIncrement: 1, // every 2 levels +1 length
    endlessTimeDecrement: 50, // -50ms per step
    perfectBonus: 100,
    perGlyph: 10,
    streakStep: 5,
    maxSpeedBonus: 50,
};

export type GamePhase = 'intro' | 'showingSequence' | 'awaitingInput' | 'success' | 'fail' | 'gameOver';