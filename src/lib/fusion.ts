import { GlyphId } from '@/config/glyphs';

export type FusionStep = { t: number; phase: 'swirl' | 'flash' | 'reveal' };
export type FusionResult = { result: GlyphId; steps: FusionStep[] };

/** Base weights for each glyph (tune to taste). Must include all GlyphId keys. */
const WEIGHTS: Record<GlyphId, number> = {
    gale: 1,
    ember: 1,
    ward: 1,
    snare: 1,
    soothe: 1,
    // Fusion-only glyph: keep weight 0 so it only appears via an explicit rule.
    aegis: 0,
    void: 0
};

/** Returns a weighted random glyph, optionally overridden by fusion rules. */
export function fuseRunesByProbability(input: GlyphId[]): FusionResult {
    const unique = Array.from(new Set(input));

    // --- Example fusion rule: Ward + Soothe -> Aegis
    if (unique.includes('ward') && unique.includes('soothe')) {
        return {
            result: 'aegis',
            steps: [
                { t: 0.0, phase: 'swirl' },
                { t: 1.0, phase: 'flash' },
                { t: 1.5, phase: 'reveal' },
            ],
        };
    }

    // Light bias towards the runes the player actually used
    const bias: Partial<Record<GlyphId, number>> = {};
    input.forEach((r) => (bias[r] = (bias[r] ?? 0) + 0.75));

    const pool = Object.entries(WEIGHTS) as Array<[GlyphId, number]>;
    const weighted = pool.map(([id, base]) => [id, base + (bias[id] ?? 0)]) as Array<[GlyphId, number]>;
    const total = weighted.reduce((a, [, w]) => a + w, 0);

    let pick = Math.random() * total;
    let result = weighted[0][0];
    for (const [id, w] of weighted) {
        pick -= w;
        if (pick <= 0) {
            result = id;
            break;
        }
    }

    // Fusion timeline (seconds)
    const steps: FusionStep[] = [
        { t: 0.0, phase: 'swirl' },
        { t: 1.0, phase: 'flash' },
        { t: 1.5, phase: 'reveal' },
    ];

    return { result, steps };
}
