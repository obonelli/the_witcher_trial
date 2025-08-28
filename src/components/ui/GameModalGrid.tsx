// src/components/ui/GameModalGrid.tsx
'use client';

import { useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import Image from 'next/image';
import { GLYPHS, GlyphDef, GlyphId } from '@/config/glyphs';

/**
 * NOTE:
 * - This component NO LONGER contains a surrender/destroy button.
 * - Props `level` and `onSurrender` were removed to keep the grid clean.
 * - Everything else remains the same (FX, layout, input handling hook-up).
 */

// Per-rune highlight colors
const RUNE_COLOR: Record<GlyphId, string> = {
  ember: 'rgba(255,165,0,1)', // orange
  gale: 'rgba(58,184,255,1)', // blue
  snare: 'rgba(34,197,94,1)', // green
  soothe: 'rgba(255,255,255,1)', // white
  ward: 'rgba(139,92,246,1)', // purple
  void: 'rgba(236, 72, 153, 1)', // magenta/fuchsia
  aegis: 'rgba(139,92,246,1)', // fallback (not shown on board)
};

// Safe alpha helper for rgb/rgba strings
function withAlpha(color: string, alpha: number): string {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (!m) return color;
  const [, r, g, b] = m;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Impact animations (on hit) ───────────────────────────────────────────
const ringFx = keyframes`
  0%   { transform: scale(0.6); opacity: 0.95; }
  70%  { transform: scale(1.15); opacity: 0.45; }
  100% { transform: scale(1.28); opacity: 0; }
`;
const shardFx = keyframes`
  0%   { transform: translate(0,0) rotate(var(--r)) scale(0.6); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) rotate(var(--r)) scale(1); opacity: 0; }
`;

// ── Panel recoil when taking damage ──────────────────────────────────────
const shakeFx = keyframes`
  0% { transform: translate3d(0,0,0); }
  20% { transform: translate3d(-2px, 1px, 0); }
  40% { transform: translate3d(2px, -1px, 0); }
  60% { transform: translate3d(-1px, 1px, 0); }
  80% { transform: translate3d(1px, 0, 0); }
  100% { transform: translate3d(0,0,0); }
`;

// ── Claw slashes (randomized, non-sweeping) ─────────────────────────────
const slashInFx = keyframes`
  0%   { transform: translate(var(--dx), var(--dy)) scaleX(0.96); filter: blur(1.2px); opacity: 0; }
  25%  { opacity: 1; filter: blur(0.4px); }
  70%  { opacity: .92; }
  100% { transform: translate(0, 0) scaleX(1); filter: blur(0.2px); opacity: 0; }
`;

// A quick traveling glint along each slash
const glintFx = keyframes`
  0%   { left: -30%; opacity: 0; }
  20%  { opacity: .9; }
  60%  { opacity: .8; }
  100% { left: 130%; opacity: 0; }
`;

// Small seeded RNG so each damage event produces stable randoms
function makeRng(seedNum: number) {
  let s = (seedNum ^ 0x9e3779b9) >>> 0;
  return () => {
    // xorshift32
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17; s >>>= 0;
    s ^= s << 5; s >>>= 0;
    return (s >>> 0) / 0xffffffff;
  };
}

type Props = {
  stage: 'countdown' | 'live';
  activeId: GlyphId | null;
  canClick: boolean;
  paused: boolean;
  fxStamp: Partial<Record<GlyphId, number>>;
  onTilePointer: (id: GlyphId) => void;

  /** Timestamp/nonce that changes on every damage event (miss/omission). */
  damageStamp?: number;
};

export default function GameModalGrid({
  stage,
  activeId,
  canClick,
  paused,
  fxStamp,
  onTilePointer,
  damageStamp,
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

  const damageOn = !!damageStamp;

  // Build randomized claw slashes for this damage event
  const slashes = useMemo(() => {
    if (!damageStamp) return [];
    const rng = makeRng(damageStamp | 0);

    // 2–3 slashes per hit
    const count = 2 + Math.floor(rng() * 2);

    return Array.from({ length: count }).map((_, i) => {
      // Angle: diagonals around -20° to -65° (sometimes mirrored)
      const base = -20 - rng() * 45;
      const mirror = rng() < 0.5 ? 1 : -1;
      const angle = base * mirror;

      // Position (as % of panel), padded so edges are not too tight
      const top = 10 + rng() * 70; // 10%..80%
      const left = 6 + rng() * 68; // 6%..74%

      // Length and thickness
      const lengthPct = 34 + rng() * 26; // 34%..60% of panel width
      const thickness = 5 + Math.floor(rng() * 4); // 5..8 px

      // Slight travel vector to sell the impact (px)
      const dx = (rng() * 24 - 12).toFixed(1);
      const dy = (rng() * 16 - 8).toFixed(1);

      // Stagger each slash a bit
      const delay = i * (80 + Math.floor(rng() * 60)); // 80–140ms

      return { angle, top, left, lengthPct, thickness, dx, dy, delay };
    });
  }, [damageStamp]);

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
        position: 'relative',

        // Short shake when taking damage
        animation: damageOn && !paused ? `${shakeFx} 240ms ease-out` : 'none',
      }}
    >
      {/* Randomized diagonal claw slashes (no left↔right sweep) */}
      {damageOn && !paused && (
        <Box
          key={damageStamp} // retrigger on new damage
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 2,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {slashes.map((s, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: `${s.lengthPct}%`,
                height: 0,
                transform: `rotate(${s.angle}deg)`,
                filter: 'blur(0.2px)',
              }}
            >
              {/* Core gash */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: s.thickness,
                  borderRadius: s.thickness / 2,
                  background:
                    'linear-gradient(to bottom, rgba(255,40,60,0) 0%, rgba(255,80,100,0.9) 35%, #ffffff 50%, rgba(255,80,100,0.9) 65%, rgba(255,40,60,0) 100%)',
                  boxShadow:
                    '0 0 14px rgba(255,60,80,.55), 0 0 28px rgba(255,40,60,.35), inset 0 0 6px rgba(255,255,255,.55)',
                  filter: 'drop-shadow(0 0 8px rgba(255,0,24,.35))',
                  animation: `${slashInFx} 360ms cubic-bezier(.2,.55,.25,1) both`,
                  animationDelay: `${s.delay}ms`,
                }}
                style={
                  {
                    ['--dx' as any]: `${s.dx}px`,
                    ['--dy' as any]: `${s.dy}px`,
                  } as React.CSSProperties
                }
              />

              {/* Light haze around the gash */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -(s.thickness * 3),
                  left: '-4%',
                  width: '108%',
                  height: s.thickness * 6,
                  background:
                    'radial-gradient(60% 60% at 30% 50%, rgba(255,50,70,.32) 0%, rgba(255,50,70,0) 70%)',
                  filter: 'blur(6px)',
                  opacity: 0,
                  animation: `${slashInFx} 380ms cubic-bezier(.2,.55,.25,1) both`,
                  animationDelay: `${s.delay}ms`,
                }}
                style={
                  {
                    ['--dx' as any]: `${Number(s.dx) * 0.6}px`,
                    ['--dy' as any]: `${Number(s.dy) * 0.6}px`,
                  } as React.CSSProperties
                }
              />

              {/* Traveling glint (short path over the gash) */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -(s.thickness * 2),
                  width: 90,
                  height: s.thickness * 5,
                  background:
                    'radial-gradient(40% 60% at 50% 50%, rgba(255,255,255,.8) 0%, rgba(255,255,255,0) 70%)',
                  mixBlendMode: 'screen',
                  animation: `${glintFx} 360ms linear both`,
                  animationDelay: `${s.delay + 40}ms`,
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      <Box
        sx={{
          position: 'relative',
          zIndex: 3, // above overlay background
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
                  cursor:
                    !paused && stage === 'live' && canClick ? 'pointer' : 'default',
                  border: isActive
                    ? `2px solid ${borderColor}`
                    : '2px solid transparent',
                  transition:
                    'border-color 120ms ease, transform 140ms ease, box-shadow 140ms ease',
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
                      const styleVars: React.CSSProperties &
                        Record<'--tx' | '--ty' | '--r', string> = {
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
                        ? `drop-shadow(0 0 14px ${withAlpha(
                            RUNE_COLOR[id] ?? 'rgba(124,77,255,1)',
                            0.55
                          )})`
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
