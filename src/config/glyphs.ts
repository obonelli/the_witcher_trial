// Base glyph model (keep comments in English)
export type GlyphId =
    | 'gale'
    | 'ember'
    | 'ward'
    | 'snare'
    | 'soothe'
    | 'void'    // 👈 new playable glyph
    // fusion-only
    | 'aegis';

export type GlyphDef = {
    id: GlyphId;
    name: string;
    /** Keyboard hint (not used for input now). Use '-' for fusion-only glyphs. */
    key: string;
    /** Base icon (PNG in /public/assets/glyphs). */
    png: string;
    /** Highlighted/active icon (optional). */
    pngActive?: string;
    /** Sound effect path (in /public/assets/sfx). */
    sfx: string;
};

/** Playable glyphs shown on the game board (now 6 for a full 3x2). */
const BASE_GLYPHS: GlyphDef[] = [
    { id: 'gale', name: 'Gale', key: '1', png: '/assets/glyphs/gale.png', pngActive: '/assets/glyphs/gale_active.png', sfx: '/assets/sfx/gale.mp3' },
    { id: 'ember', name: 'Ember', key: '2', png: '/assets/glyphs/ember.png', pngActive: '/assets/glyphs/ember_active.png', sfx: '/assets/sfx/ember.mp3' },
    { id: 'ward', name: 'Ward', key: '3', png: '/assets/glyphs/ward.png', pngActive: '/assets/glyphs/ward_active.png', sfx: '/assets/sfx/ward.mp3' },
    { id: 'snare', name: 'Snare', key: '4', png: '/assets/glyphs/snare.png', pngActive: '/assets/glyphs/snare_active.png', sfx: '/assets/sfx/snare.mp3' },
    { id: 'soothe', name: 'Soothe', key: '5', png: '/assets/glyphs/soothe.png', pngActive: '/assets/glyphs/soothe_active.png', sfx: '/assets/sfx/soothe.mp3' },
    { id: 'void', name: 'Void', key: '6', png: '/assets/glyphs/void.png', pngActive: '/assets/glyphs/void_active.png', sfx: '/assets/sfx/void.mp3' }, // 👈 new
];

/** Fusion-only glyphs (do not appear on the board). */
const FUSION_ONLY_GLYPHS: GlyphDef[] = [
    { id: 'aegis', name: 'Aegis', key: '-', png: '/assets/glyphs/aegis.png', pngActive: '/assets/glyphs/aegis_active.png', sfx: '/assets/sfx/aegis.mp3' },
];

/** Exported list used by the board. */
export const GLYPHS: GlyphDef[] = BASE_GLYPHS;

/** Full list used for lookups (e.g., FusionModal). */
export const ALL_GLYPHS: GlyphDef[] = [...BASE_GLYPHS, ...FUSION_ONLY_GLYPHS];

/** Constant-time lookup by id (covers fusion-only ids). */
export const GLYPH_LOOKUP: Record<GlyphId, GlyphDef> =
    Object.fromEntries(ALL_GLYPHS.map(g => [g.id, g])) as Record<GlyphId, GlyphDef>;

/** Legacy helper: now includes the "6" hint. */
export const GLYPH_BY_KEY: Record<string, GlyphId> = {
    '1': 'gale',
    '2': 'ember',
    '3': 'ward',
    '4': 'snare',
    '5': 'soothe',
    '6': 'void',
};
