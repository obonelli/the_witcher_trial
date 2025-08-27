// src/components/ui/CountdownBoardModal.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, Dialog, DialogContent, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { GLYPHS, GlyphDef, GlyphId } from '@/config/glyphs';

type Stage = 'countdown' | 'live';

type Props = {
    open: boolean;
    stage: Stage;                 // 'countdown' | 'live'
    seconds?: number;             // default 3 (only used in countdown stage)
    activeId: GlyphId | null;     // lit glyph while showingSequence
    canClick: boolean;            // guard to only accept clicks when lit
    onGlyph: (id: GlyphId) => void;
    onCountdownDone: () => void;  // called once 3-2-1 ends
};

export default function GameModal({
    open,
    stage,
    seconds = 3,
    activeId,
    canClick,
    onGlyph,
    onCountdownDone,
}: Props) {
    // Use the 5 playable glyphs; if you want to show Aegis, add it here as visual-only.
    const glyphs: GlyphDef[] = useMemo(() => GLYPHS.slice(0, 5), []);

    // Countdown state
    const [t, setT] = useState(seconds);

    useEffect(() => {
        if (!open || stage !== 'countdown') return;
        setT(seconds);
        const id = setInterval(() => {
            setT((prev) => {
                if (prev <= 1) {
                    clearInterval(id);
                    setTimeout(onCountdownDone, 80);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [open, stage, seconds, onCountdownDone]);

    // Keyboard support while playing in the modal
    const onKey = useCallback(
        (ev: KeyboardEvent) => {
            if (!open || stage !== 'live' || !canClick) return;
            const g = glyphs.find((x) => x.key === ev.key);
            if (g) onGlyph(g.id as GlyphId);
        },
        [open, stage, canClick, glyphs, onGlyph]
    );

    useEffect(() => {
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onKey]);

    return (
        <Dialog
            open={open}
            onClose={() => { /* lock while playing; close is controlled by parent */ }}
            maxWidth="md"
            fullWidth
            keepMounted
            PaperProps={{
                sx: {
                    bgcolor: '#0e0b14',
                    borderRadius: 2,
                    boxShadow: '0 0 0 1px rgba(124,77,255,0.25), 0 16px 40px rgba(0,0,0,0.6)',
                },
            }}
        >
            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={2} alignItems="center">
                    <Box sx={{ height: 28, display: 'grid', placeItems: 'center', width: '100%' }}>
                        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            {stage === 'countdown' ? 'Get ready…' : 'Your turn! Tap the lit glyph'}
                        </Typography>
                    </Box>

                    {/* 3x2 grid (with 5 glyphs it renders 3-2; with 6, 3-3) */}
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: 700,
                            borderRadius: 2,
                            p: 2,
                            background: 'linear-gradient(180deg, rgba(29,25,38,0.6), rgba(20,16,28,0.6))',
                            boxShadow: 'inset 0 0 0 1px rgba(124,77,255,0.25)',
                        }}
                    >
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            {glyphs.map((g) => {
                                const isActive = stage === 'live' && activeId === (g.id as GlyphId);
                                return (
                                    <Box
                                        key={g.id}
                                        onClick={() => (stage === 'live' && canClick ? onGlyph(g.id as GlyphId) : undefined)}
                                        sx={{
                                            height: 150,
                                            borderRadius: 1.5,
                                            backgroundColor: '#12101a',
                                            boxShadow:
                                                'inset 0 0 0 1px rgba(124,77,255,0.15), 0 8px 20px rgba(0,0,0,0.25)',
                                            display: 'grid',
                                            placeItems: 'center',
                                            userSelect: 'none',
                                            cursor: stage === 'live' && canClick ? 'pointer' : 'default',
                                            outline: isActive ? '2px solid rgba(124,77,255,0.9)' : '2px solid transparent',
                                            transition: 'outline-color 120ms ease, transform 120ms ease',
                                            transform: isActive ? 'scale(1.02)' : 'none',
                                        }}
                                    >
                                        <Stack spacing={1} alignItems="center">
                                            <Image
                                                src={isActive ? (g.pngActive || g.png) : g.png}
                                                alt={g.name}
                                                width={54}
                                                height={54}
                                                priority
                                                style={{
                                                    display: 'block',
                                                    filter: isActive
                                                        ? 'drop-shadow(0 0 18px rgba(124,77,255,0.65))'
                                                        : 'drop-shadow(0 0 8px rgba(124,77,255,0.25))',
                                                }}
                                                draggable={false}
                                            />
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                                {g.name} {g.key ? `(${g.key})` : ''}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>

                    {/* Countdown text */}
                    {stage === 'countdown' && (
                        <Box sx={{ position: 'relative', height: 64, display: 'grid', placeItems: 'center', width: '100%' }}>
                            <Typography
                                variant="h2"
                                sx={{ fontWeight: 800, color: 'white', textShadow: '0 0 22px rgba(124,77,255,0.6)', letterSpacing: 1 }}
                            >
                                {t > 0 ? t : 'GO!'}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
