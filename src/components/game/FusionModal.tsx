// src/components/game/FusionModal.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box, Dialog, DialogContent, DialogTitle,
    IconButton, Stack, Typography, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { GLYPHS, GlyphDef, GlyphId } from '@/config/glyphs';
import { fuseRunesByProbability } from '@/lib/fusion';

// Fast lookup map <GlyphId, GlyphDef>
const GLYPH_MAP = Object.fromEntries(GLYPHS.map(g => [g.id, g])) as Record<GlyphId, GlyphDef>;
const getGlyph = (id: GlyphId) => GLYPH_MAP[id];

type Props = {
    open: boolean;
    onClose: () => void;
    runesUsed: GlyphId[];
    onResult?: (id: GlyphId) => void; // fires once after the clip ends
};

/**
 * FusionModal (pre-rendered version)
 * ----------------------------------
 * Shows a pre-baked GIF of the fusion animation (swirl → flash → reveal),
 * so we avoid runtime flicker and timing issues. We still compute the
 * "result" from the fusion logic, but the visual clip is fixed to Aegis.
 */
export default function FusionModal({ open, onClose, runesUsed, onResult }: Props) {
    // Compute the fusion outcome (kept for game logic / scoring)
    const { result } = useMemo(() => fuseRunesByProbability(runesUsed), [runesUsed]);

    // Duration of the pre-rendered GIF (ms). Keep this in sync with the asset.
    const CLIP_MS = 5000;

    // Fire onResult once per open (use a ref to avoid stale state in the timeout).
    const [, setFired] = useState(false);
    const firedRef = useRef(false);
    useEffect(() => {
        if (!open) { setFired(false); firedRef.current = false; return; }
        setFired(false);
        firedRef.current = false;

        const id = setTimeout(() => {
            if (!firedRef.current) {
                onResult?.(result);
                firedRef.current = true;
                setFired(true);
            }
        }, CLIP_MS + 100); // tiny buffer

        return () => clearTimeout(id);
    }, [open, result, onResult]);

    // Optional: label to show below the clip
    const label = getGlyph(result)?.name ?? String(result).toUpperCase();

    // NOTE: If later you export an MP4, you can swap <Image> for <video> easily.
    const GIF_SRC = '/assets/animations/fusion_aegis_dark_5s.gif';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            keepMounted
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { bgcolor: '#0e0b14' } }}
        >
            <DialogTitle sx={{ pr: 6, color: 'white' }}>
                Rune Fusion
                <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ overflow: 'visible' }}>
                <Stack spacing={2} alignItems="center">
                    {/* Pre-rendered clip container */}
                    <Box
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: '0 0 0 1px rgba(124,77,255,0.25), 0 12px 30px rgba(124,77,255,0.2)'
                        }}
                    >
                        {/* Fixed-size ensures no layout shift */}
                        <Image
                            src={GIF_SRC}
                            alt="Fusion animation"
                            width={520}
                            height={520}
                            priority
                            unoptimized
                            style={{ display: 'block' }}
                        />
                    </Box>

                    {/* Informational caption */}
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>
                        The animation is pre-rendered for a smooth look. Result:&nbsp;<strong>{label}</strong>.
                    </Typography>

                    {/* Optional: direct download of the GIF asset */}
                    <Button
                        variant="outlined"
                        component="a"
                        href={GIF_SRC}
                        download="fusion_aegis.gif"
                    >
                        Download clip (GIF)
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
