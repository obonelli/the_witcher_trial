// src/components/ui/GameModalGrid.tsx
'use client';

import { useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import Image from 'next/image';
import { GLYPHS, GlyphDef, GlyphId } from '@/config/glyphs';

// Per-rune highlight colors
const RUNE_COLOR: Record<GlyphId, string> = {
    ember: 'rgba(255,165,0,1)',    // orange
    gale: 'rgba(58,184,255,1)',    // blue
    snare: 'rgba(34,197,94,1)',    // green
    soothe: 'rgba(255,255,255,1)', // white
    ward: 'rgba(139,92,246,1)',    // purple
    void: 'rgba(236, 72, 153, 1)', // magenta/fuchsia
    aegis: 'rgba(139,92,246,1)',   // fallback (not shown on board)
};

// Safe alpha helper for rgb/rgba strings
function withAlpha(color: string, alpha: number): string {
    const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (!m) return color;
    const [, r, g, b] = m;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Impact animations
const ringFx = keyframes`
  0%   { transform: scale(0.6); opacity: 0.95; }
  70%  { transform: scale(1.15); opacity: 0.45; }
  100% { transform: scale(1.28); opacity: 0; }
`;
const shardFx = keyframes`
  0%   { transform: translate(0,0) rotate(var(--r)) scale(0.6); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) rotate(var(--r)) scale(1); opacity: 0; }
`;

type Props = {
    stage: 'countdown' | 'live';
    activeId: GlyphId | null;
    canClick: boolean;
    paused: boolean;
    fxStamp: Partial<Record<GlyphId, number>>;
    onTilePointer: (id: GlyphId) => void;
};

export default function GameModalGrid({
    stage,
    activeId,
    canClick,
    paused,
    fxStamp,
    onTilePointer,
}: Props) {
    // 6 playable glyphs → 3x2 (desktop) / 2x3 (mobile)
    const glyphs: GlyphDef[] = useMemo(() => GLYPHS.slice(0, 6), []);

    // Precompute shard vectors once (no hooks inside map)
    const shardVectors = useMemo(() => {
        const arr: { tx: number; ty: number; r: number }[] = [];
        const radius = 46;
        for (let i = 0; i < 8; i++) {
            const ang = (i * 360) / 8;
            const rad = (ang * Math.PI) / 180;
            arr.push({ tx: Math.cos(rad) * radius, ty: Math.sin(rad) * radius, r: ang });
        }
        return arr;
    }, []);

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: 700,
                borderRadius: 2,
                p: { xs: 1.5, sm: 2 },
                background: 'linear-gradient(180deg, rgba(29,25,38,0.6), rgba(20,16,28,0.6))',
                boxShadow: 'inset 0 0 0 1px rgba(124,77,255,0.25)',
                minHeight: { xs: 280, sm: 300 },
                display: 'grid',
                alignItems: 'center',
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                    gap: { xs: 12, sm: 16 },
                }}
            >
                {glyphs.map((g) => {
                    const id = g.id as GlyphId;
                    const isActive = !paused && stage === 'live' && activeId === id;
                    const c = RUNE_COLOR[id] ?? 'rgba(124,77,255,1)';

                    const borderColor = withAlpha(c, 0.9);
                    const glowColor = withAlpha(c, 0.55);
                    const insetColor = withAlpha(c, 0.7);

                    const baseShadow =
                        'inset 0 0 0 1px rgba(124,77,255,0.15), 0 8px 20px rgba(0,0,0,0.25)';
                    const activeShadow = `0 0 18px ${glowColor}, 0 0 6px ${glowColor}, inset 0 0 0 2px ${insetColor}`;

                    const burstOn = fxStamp[id] !== undefined;

                    return (
                        // WRAPPER: bigger hit area
                        <Box
                            key={g.id}
                            role="button"
                            aria-pressed={isActive || undefined}
                            onPointerDown={(e) => {
                                if (paused) return;
                                // No setPointerCapture para evitar "any" y mantener simple
                                e.preventDefault();
                                e.stopPropagation();
                                onTilePointer(id);
                            }}
                            sx={{
                                p: { xs: 1, sm: 1.25 },
                                m: { xs: '-2px', sm: '-4px' },
                                borderRadius: 2,
                                touchAction: 'manipulation',
                                pointerEvents: paused ? 'none' : 'auto',
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'relative',
                                    height: { xs: 128, sm: 150 },
                                    borderRadius: 1.5,
                                    backgroundColor: '#12101a',
                                    boxShadow: isActive ? activeShadow : baseShadow,
                                    display: 'grid',
                                    placeItems: 'center',
                                    userSelect: 'none',
                                    cursor: (!paused && stage === 'live' && canClick) ? 'pointer' : 'default',
                                    border: isActive ? `2px solid ${borderColor}` : '2px solid transparent',
                                    transition: 'border-color 120ms ease, transform 140ms ease, box-shadow 140ms ease',
                                    transform: isActive ? 'scale(1.05)' : 'scale(1.0)',
                                    opacity: paused ? 0.6 : 1,
                                }}
                            >
                                {/* Burst FX overlay (ring + shards) */}
                                {burstOn && !paused && (
                                    <Box
                                        key={fxStamp[id]}
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'grid',
                                            placeItems: 'center',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: '74%',
                                                height: '74%',
                                                borderRadius: 8,
                                                border: `2px solid ${borderColor}`,
                                                boxShadow: `0 0 24px ${glowColor}`,
                                                animation: `${ringFx} 420ms ease-out forwards`,
                                            }}
                                        />
                                        {shardVectors.map((s, i) => {
                                            const styleVars: React.CSSProperties & Record<'--tx' | '--ty' | '--r', string> = {
                                                '--tx': `${s.tx}px`,
                                                '--ty': `${s.ty}px`,
                                                '--r': `${s.r}deg`,
                                            };
                                            return (
                                                <Box
                                                    key={i}
                                                    sx={{
                                                        position: 'absolute',
                                                        width: 8,
                                                        height: 14,
                                                        borderRadius: 1,
                                                        backgroundColor: borderColor,
                                                        boxShadow: `0 0 10px ${glowColor}`,
                                                        transformOrigin: 'center',
                                                        animation: `${shardFx} 460ms ease-out forwards`,
                                                    }}
                                                    style={styleVars}
                                                />
                                            );
                                        })}
                                    </Box>
                                )}

                                <Stack spacing={1} alignItems="center">
                                    <Image
                                        src={isActive ? (g.pngActive || g.png) : g.png}
                                        alt={g.name}
                                        width={52}
                                        height={52}
                                        priority
                                        style={{
                                            display: 'block',
                                            filter: isActive
                                                ? `drop-shadow(0 0 14px ${glowColor})`
                                                : 'drop-shadow(0 0 8px rgba(124,77,255,0.25))',
                                        }}
                                        draggable={false}
                                    />
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'rgba(255,255,255,0.85)', fontSize: { xs: 11, sm: 12 } }}
                                    >
                                        {g.name}
                                    </Typography>
                                </Stack>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
