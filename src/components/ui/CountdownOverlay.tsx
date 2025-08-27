'use client';

import { useEffect, useState } from 'react';
import { Box, Fade } from '@mui/material';

type Props = {
    /** Whether the overlay is visible */
    open: boolean;
    /** Called after 3-2-1-Go! finishes */
    onComplete?: () => void;
    /** Seconds to count (default 3) */
    seconds?: number;
};

export default function CountdownOverlay({ open, onComplete, seconds = 3 }: Props) {
    // Internal state to display: 3 -> 2 -> 1 -> "Go!"
    const [tick, setTick] = useState<number>(seconds);
    const [showGo, setShowGo] = useState(false);

    useEffect(() => {
        if (!open) return;

        setTick(seconds);
        setShowGo(false);

        // Use a simple 1s cadence; keep it robust on tab throttling
        const id = setInterval(() => {
            setTick((t) => {
                if (t <= 1) {
                    clearInterval(id);
                    setShowGo(true);
                    // Hold "Go!" briefly before completing
                    // const done = setTimeout(() => {
                    //     setShowGo(false);
                    //     onComplete?.();
                    // }, 600);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => {
            clearInterval(id);
        };
    }, [open, seconds, onComplete]);

    if (!open) return null;

    return (
        <Fade in={open} timeout={150}>
            <Box
                sx={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: (t) => t.zIndex.modal + 2,
                    display: 'grid',
                    placeItems: 'center',
                    background:
                        'radial-gradient(1200px 1200px at 50% 50%, rgba(10,8,16,0.82), rgba(10,8,16,0.95))',
                    backdropFilter: 'blur(2px)',
                }}
            >
                <Box
                    sx={{
                        fontSize: { xs: 72, sm: 96 },
                        fontWeight: 800,
                        letterSpacing: 2,
                        color: 'white',
                        textShadow: '0 0 24px rgba(124,77,255,0.55)',
                        userSelect: 'none',
                        transform: 'scale(1)',
                        animation: 'pop 450ms ease-out',
                        '@keyframes pop': {
                            '0%': { transform: 'scale(0.7)', opacity: 0 },
                            '60%': { transform: 'scale(1.05)', opacity: 1 },
                            '100%': { transform: 'scale(1)', opacity: 1 },
                        },
                    }}
                >
                    {showGo ? '¡Go!' : tick}
                </Box>
            </Box>
        </Fade>
    );
}
