// src/components/game/GameBoard.tsx
'use client';

import Image from 'next/image';
import { GLYPHS, GlyphDef, GlyphId } from '@/config/glyphs';
import GlyphButton from '../ui/GlyphButton';
import { JSX } from 'react';
import { playSfx } from '@/lib/audio'; // play only on user click

/** Small visual fake tile (not clickable) used in higher levels */
function FakeGlyphTile({ glyph }: { glyph: GlyphDef }) {
    const src = glyph.png || undefined; // guard against empty
    return (
        <div className="fake-tile aspect-square rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col items-center justify-center">
            {src && (
                <Image
                    src={src}
                    alt={`${glyph.name} (fake)`}
                    width={88}
                    height={88}
                    priority
                />
            )}
            <div className="mt-1 text-xs opacity-60">{glyph.name}</div>
        </div>
    );
}

export default function GameBoard({
    onGlyph,
    highlightedId,
    lastHit,         // { id, ok, nonce } to flash good/bad briefly
    fakeCount = 0,   // number of fake tiles to render (not clickable)
    canClick = false // allow taps only when true (live turn)
}: {
    onGlyph?: (id: GlyphId) => void;
    highlightedId?: GlyphId | null;
    lastHit?: { id: GlyphId; ok: boolean; nonce: number } | null;
    fakeCount?: number;
    canClick?: boolean;
}) {
    // Build the real glyph grid
    const real = GLYPHS.map((g) => {
        // Determine feedback state for this glyph
        const fb =
            lastHit && lastHit.id === g.id
                ? (lastHit.ok ? 'good' : 'bad')
                : 'idle';

        return (
            <GlyphButton
                key={g.id}
                glyph={g}
                onClick={async () => {
                    if (!canClick) return;      // ignore clicks when not the player's turn
                    onGlyph?.(g.id);            // propagate the click to game logic
                    // 🔊 Play SFX only on user click (helper does mp3→wav fallback)
                    try { await playSfx(g.sfx); } catch { /* ignore autoplay policy errors */ }
                }}
                highlighted={highlightedId === g.id}
                feedback={fb as 'idle' | 'good' | 'bad'}
                disabled={!canClick}            // disable pointer/keyboard when not clickable
            />
        );
    });

    // Choose some fakes (repeat first N glyphs for simplicity)
    const fakes: JSX.Element[] = [];
    for (let i = 0; i < fakeCount; i++) {
        const idx = i % GLYPHS.length;
        fakes.push(<FakeGlyphTile key={`fake-${i}`} glyph={GLYPHS[idx]} />);
    }

    return (
        <div className="grid grid-cols-3 gap-4 select-none">
            {real}
            {fakes}
        </div>
    );
}
