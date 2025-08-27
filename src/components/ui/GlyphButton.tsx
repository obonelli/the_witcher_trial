'use client';

import Image from 'next/image';
import { GlyphDef } from '@/config/glyphs';
import { playSfx } from '@/lib/audio'; // <- fallback mp3→wav

export default function GlyphButton({
    glyph,
    highlighted = false,
    feedback = 'idle',
    disabled = false,        // block taps/hover when true
    onClick,
}: {
    glyph: GlyphDef;
    highlighted?: boolean;
    feedback?: 'idle' | 'good' | 'bad';
    disabled?: boolean;
    onClick?: () => void;
}) {
    // Choose asset (active when highlighted)
    const src = (highlighted ? glyph.pngActive : glyph.png) || undefined;

    // Visual ring based on feedback/highlight
    const ring =
        feedback === 'good'
            ? 'ring-2 ring-emerald-400/70'
            : feedback === 'bad'
                ? 'ring-2 ring-rose-400/70'
                : highlighted
                    ? 'ring-2 ring-violet-400/60'
                    : 'ring-1 ring-white/10';

    const bg =
        feedback === 'good'
            ? 'bg-emerald-400/10'
            : feedback === 'bad'
                ? 'bg-rose-400/10'
                : highlighted
                    ? 'bg-violet-400/10'
                    : 'bg-white/5';

    const handleUserActivate = async () => {
        if (disabled) return;
        onClick?.();                 // notifica a la lógica de juego
        try { await playSfx(glyph.sfx); } catch { /* ignore autoplay policy */ }
    };

    return (
        <button
            type="button"
            onClick={handleUserActivate}
            onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleUserActivate();
                }
            }}
            disabled={disabled}
            className={`group flex flex-col items-center justify-center aspect-square rounded-xl p-3 transition ${ring} ${bg}
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:brightness-110 hover:scale-[1.01] active:scale-[0.99]'}`}
            style={{ touchAction: 'manipulation' }}
            aria-label={`Glyph ${glyph.name}`}
            tabIndex={0}
        >
            {src ? (
                <Image src={src} alt={glyph.name} width={88} height={88} draggable={false} />
            ) : (
                <div
                    className="w-[88px] h-[88px] rounded-md"
                    style={{
                        boxShadow: '0 0 18px rgba(193,88,255,0.35) inset, 0 0 14px rgba(193,88,255,0.25)',
                        border: '2px solid rgba(193,88,255,0.9)',
                    }}
                />
            )}
            <div className="mt-1 text-xs opacity-70">{glyph.name}</div>
        </button>
    );
}
