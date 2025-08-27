export function streakMultiplier(streak: number) {
    return 1 + Math.floor(streak / 5);
}

export function speedBonus(timeRemainingMs: number, roundTotalMs: number, max = 50) {
    const r = Math.max(0, Math.min(max, (timeRemainingMs / Math.max(1, roundTotalMs)) * max));
    return Math.round(r);
}

export function calcRoundScore({
    correctCount,
    perGlyph = 10,
    streakMult = 1,
    speed = 0,
    perfectBonus = 0,
}: {
    correctCount: number;
    perGlyph?: number;
    streakMult?: number;
    speed?: number;
    perfectBonus?: number;
}) {
    return correctCount * perGlyph * streakMult + speed + perfectBonus;
}
