// src/components/ui/GameModal.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Box,
    Dialog,
    DialogContent,
    Stack,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { GLYPHS, GlyphDef, GlyphId } from '@/config/glyphs';

import GameModalTopBar from './GameModalTopBar';
import GameModalHud from './GameModalHud';
import GameModalGrid from './GameModalGrid';

type Stage = 'countdown' | 'live';

type Props = {
    open: boolean;
    stage: Stage; // 'countdown' | 'live'
    seconds?: number; // default 3 (for countdown)
    activeId: GlyphId | null; // glyph lit while the sequence is showing
    canClick: boolean; // only accept taps while a glyph is lit
    energy: number; // 0..1 (always visible, also during countdown)
    onGlyph: (id: GlyphId) => void;
    onCountdownDone: () => void; // called once 3-2-1 finishes
    onSurrender?: () => void;

    // Stats
    score: number;
    level: number;
    streak: number;
    mult: number;

    // Damage FX (timestamp/nonce updated on miss/omission)
    damageStamp?: number;

    // Pause/Resume (controlled if provided). If omitted, component manages local pause state.
    paused?: boolean;
    onTogglePause?: () => void;
};

/**
 * Main game modal:
 * - Wires keyboard/mouse input, pause state, countdown, and FX triggers.
 * - Passes `level` to the TopBar so it can flip "Surrender" → "Destroy the Beast".
 * - The grid is purely for tiles/FX; no surrender button inside.
 */
export default function GameModal({
    open,
    stage,
    seconds = 3,
    activeId,
    canClick,
    energy,
    onGlyph,
    onCountdownDone,
    onSurrender,
    score,
    level,
    streak,
    mult,
    damageStamp,
    paused,
    onTogglePause,
}: Props) {
    // Breakpoint
    const isMobile = useMediaQuery('(max-width:480px)');

    // Local pause state when uncontrolled
    const [localPaused, setLocalPaused] = useState(false);
    const pausedEffective = typeof paused === 'boolean' ? paused : localPaused;

    const togglePause = useCallback(() => {
        if (onTogglePause) onTogglePause();
        else setLocalPaused((p) => !p);
    }, [onTogglePause]);

    // Burst FX trigger per tile
    const [fxStamp, setFxStamp] = useState<Partial<Record<GlyphId, number>>>({});

    // Track last lit glyph + timestamp to allow a grace window
    const lastLitRef = useRef<{ id: GlyphId | null; ts: number }>({ id: null, ts: 0 });
    useEffect(() => {
        if (!activeId) return;
        lastLitRef.current = { id: activeId, ts: performance.now() };
    }, [activeId]);

    // Countdown state/loop (paused stops the tick)
    const [t, setT] = useState(seconds);
    useEffect(() => {
        if (!open || stage !== 'countdown') return;
        setT(seconds);

        let id: number | null = null;
        id = window.setInterval(() => {
            if (pausedEffective) return; // freeze countdown while paused
            setT((prev) => {
                if (prev <= 1) {
                    if (id !== null) clearInterval(id);
                    setTimeout(onCountdownDone, 80);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (id !== null) clearInterval(id);
        };
    }, [open, stage, seconds, onCountdownDone, pausedEffective]);

    /** Trigger burst FX and notify parent – using pointerdown for low latency. */
    const handleTilePointer = useCallback(
        (id: GlyphId) => {
            if (pausedEffective) return;

            // Grace window: accept presses up to 220ms after the glyph stopped being lit.
            const now = performance.now();
            const graceMs = 220;
            const litOk =
                (stage === 'live' && canClick && activeId === id) ||
                (stage === 'live' &&
                    lastLitRef.current.id === id &&
                    now - lastLitRef.current.ts <= graceMs);

            if (!litOk) return;

            // Start burst FX
            setFxStamp((prev) => ({ ...prev, [id]: now }));
            // auto-clean so subsequent taps re-trigger
            setTimeout(() => {
                setFxStamp((prev) => {
                    const rest: Partial<Record<GlyphId, number>> = { ...prev };
                    delete rest[id];
                    return rest;
                });
            }, 520);

            // Notify parent
            onGlyph(id);
        },
        [activeId, canClick, onGlyph, pausedEffective, stage]
    );

    // Keyboard shortcuts (disable while paused)
    const onKey = useCallback(
        (ev: KeyboardEvent) => {
            if (!open) return;

            // Toggle pause with "p" (lower/upper)
            if (ev.key.toLowerCase() === 'p') {
                ev.preventDefault();
                togglePause();
                return;
            }

            if (pausedEffective) return; // ignore input when paused
            if (stage !== 'live' || !canClick) return;

            const glyphs: GlyphDef[] = GLYPHS.slice(0, 6);
            const g = glyphs.find((x) => x.key === ev.key);
            if (g) handleTilePointer(g.id as GlyphId);
        },
        [open, pausedEffective, stage, canClick, togglePause, handleTilePointer]
    );

    useEffect(() => {
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onKey]);

    // Prevent background scroll while modal is open
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // Safe surrender dispatcher (no-op if not provided)
    const handleSurrenderSafe = useCallback(() => {
        onSurrender?.();
    }, [onSurrender]);

    return (
        <Dialog
            open={open}
            onClose={() => { }}
            maxWidth="md"
            fullWidth
            keepMounted
            disableScrollLock
            BackdropProps={{ sx: { alignItems: 'center', justifyContent: 'center' } }}
            PaperProps={{
                sx: {
                    mt: { xs: 2, sm: 6, md: 10 },
                    mb: { xs: 2, sm: 4, md: 6 },
                    mx: { xs: 1, sm: 'auto' }, // side margin on small screens
                    pt: 'env(safe-area-inset-top)',
                    pb: 'env(safe-area-inset-bottom)',
                    bgcolor: '#0e0b14',
                    borderRadius: { xs: 1.5, sm: 2 },
                    boxShadow:
                        '0 0 0 1px rgba(124,77,255,0.25), 0 16px 40px rgba(0,0,0,0.6)',
                    position: 'relative',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogContent
                sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 3, sm: 4 }, position: 'relative' }}
            >
                {/* Top controls (zIndex > overlay) */}
                <GameModalTopBar
                    paused={pausedEffective}
                    onTogglePause={togglePause}
                    onSurrender={handleSurrenderSafe}
                    isMobile={isMobile}
                    level={level} // NEW: pass level so the label can switch
                />

                {/* Visual overlay (does NOT block clicks) */}
                {pausedEffective && (
                    <Box
                        aria-label="Paused overlay"
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 2,
                            backdropFilter: 'blur(2px)',
                            background:
                                'linear-gradient(180deg, rgba(10,8,14,0.45), rgba(10,8,14,0.65))',
                            display: 'grid',
                            placeItems: 'center',
                            pointerEvents: 'none', // do not block top buttons
                        }}
                    >
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 800,
                                color: 'white',
                                textShadow: '0 0 20px rgba(124,77,255,0.6)',
                                letterSpacing: 1,
                                fontSize: { xs: 28, sm: 36 },
                            }}
                        >
                            Paused
                        </Typography>
                        <Typography sx={{ mt: 1, opacity: 0.8, fontSize: { xs: 12, sm: 14 } }}>
                            Press “P” or tap Resume to continue
                        </Typography>
                    </Box>
                )}

                <Stack
                    spacing={2}
                    alignItems="center"
                    sx={{ minHeight: { xs: 440, sm: 500 }, position: 'relative' }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            height: { xs: 24, sm: 28 },
                            display: 'grid',
                            placeItems: 'center',
                            width: '100%',
                        }}
                    >
                        <Typography
                            variant="subtitle1"
                            sx={{
                                color: 'rgba(255,255,255,0.95)',
                                fontFamily: `'Cinzel Decorative','Cinzel',serif`,
                                fontSize: { xs: 14, sm: 16 },
                                textShadow: '0 1px 8px rgba(0,0,0,.65)',
                                letterSpacing: '.4px',
                            }}
                        >
                            {stage === 'countdown'
                                ? 'Steel yourself, witcher — the trial begins…'
                                : 'Let the Signs flow — strike fast!'}
                        </Typography>
                    </Box>

                    {/* HUD: energy + stats */}
                    <GameModalHud
                        energy={energy}
                        stage={stage}
                        score={score}
                        level={level}
                        streak={streak}
                        mult={mult}
                        isMobile={isMobile}
                    />

                    {/* Grid (no surrender button here) */}
                    <GameModalGrid
                        stage={stage}
                        activeId={activeId}
                        canClick={canClick}
                        paused={pausedEffective}
                        fxStamp={fxStamp}
                        damageStamp={damageStamp}
                        onTilePointer={handleTilePointer}
                    />

                    {/* Countdown area (fixed height to avoid layout jump) */}
                    <Box
                        sx={{
                            height: { xs: 56, sm: 64 },
                            display: 'grid',
                            placeItems: 'center',
                            width: '100%',
                            visibility: stage === 'countdown' ? 'visible' : 'hidden',
                        }}
                    >
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 800,
                                color: 'white',
                                textShadow: '0 0 22px rgba(124,77,255,0.6)',
                                letterSpacing: 1,
                                fontSize: { xs: 40, sm: 48 },
                            }}
                        >
                            {t > 0 ? t : 'GO!'}
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
