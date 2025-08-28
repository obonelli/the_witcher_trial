'use client';

// Simple, stateless sequence visualizer.
// All comments in English.

import Image from 'next/image';
import { GlyphId, GLYPHS, GlyphDef } from '@/config/glyphs';

const byId = Object.fromEntries(GLYPHS.map(g => [g.id, g])) as Record<GlyphId, GlyphDef>;

export default function SequencePlayer({
    sequence,
    activeIndex,
    isPlaying,
    paused = false,
}: {
    sequence: GlyphId[];
    activeIndex: number;   // index currently highlighted
    isPlaying: boolean;    // true while showing sequence
    paused?: boolean;      // freeze highlight visuals
}) {
    if (!isPlaying || sequence.length === 0) {
        return <div className="text-sm opacity-70">Ready to show sequence…</div>;
    }

    return (
        <div className="grid grid-cols-6 gap-2 text-center">
            {sequence.map((id, i) => {
                const g = byId[id];
                const on = !paused && i === activeIndex;
                const src = (on ? g.pngActive : g.png) || undefined; // guard against empty
                return (
                    <div
                        key={`${id}-${i}`}
                        className={`rounded border p-2 ${on ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-white/10 bg-white/5'}`}
                    >
                        {src && <Image src={src} alt={g.name} width={36} height={36} />}
                        <div className="mt-1 text-[10px] opacity-70">{g.name}</div>
                    </div>
                );
            })}
        </div>
    );
}
