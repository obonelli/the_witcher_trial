// src/components/ui/GameModalTopBar.tsx
'use client';

import { Box, Button, Tooltip, keyframes } from '@mui/material';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';

/** Decide the label based on the current level. */
function actionLabelForLevel(level: number): string {
    if (level >= 4) return 'Destroy the Beast';
    if (level === 3) return 'Give Energy';
    return 'Surrender';
}

// Soft blink for "Give Energy"
const blinkSoft = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

// Strong pulse for "Destroy the Beast"
const blinkStrong = keyframes`
  0%   { transform: scale(1); opacity: 1; }
  50%  { transform: scale(1.08); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
`;

export default function GameModalTopBar({
    paused,
    onTogglePause,
    onSurrender,
    isMobile,
    level = 0,
}: {
    paused: boolean;
    onTogglePause: () => void;
    onSurrender?: () => void;
    isMobile?: boolean;
    level?: number;
}) {
    const actionLabel = actionLabelForLevel(level);

    // Decide which blink style applies
    const blinkStyle =
        level === 3
            ? `${blinkSoft} 1.4s ease-in-out infinite`
            : level >= 4
                ? `${blinkStrong} 1.2s ease-in-out infinite`
                : 'none';

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 8,
                right: 12,
                display: 'flex',
                gap: isMobile ? 0.75 : 1,
                zIndex: 4,
                pointerEvents: 'auto',
            }}
        >
            {/* Pause / Resume */}
            <Tooltip title={paused ? 'Resume (P)' : 'Pause (P)'} arrow>
                <Button
                    size="small"
                    onClick={onTogglePause}
                    className="btn-witcher-ghost"
                    sx={{
                        textTransform: 'none',
                        fontFamily: 'Cinzel, serif',
                        minWidth: isMobile ? 0 : 88,
                        px: isMobile ? 1 : 1.25,
                        py: 0.5,
                        lineHeight: 1.1,
                        gap: 0.4,
                    }}
                >
                    {paused ? (
                        <PlayArrowRoundedIcon fontSize="small" />
                    ) : (
                        <PauseRoundedIcon fontSize="small" />
                    )}
                    {paused ? 'Resume' : 'Pause'}
                </Button>
            </Tooltip>

            {/* Action Button (label changes with level) */}
            {onSurrender && (
                <Tooltip title={`${actionLabel} (Esc)`} arrow>
                    <Button
                        size="small"
                        onClick={onSurrender}
                        className="btn-danger"
                        sx={{
                            textTransform: 'none',
                            fontFamily: 'Cinzel, serif',
                            minWidth: isMobile ? 0 : 120,
                            px: isMobile ? 1 : 1.25,
                            py: 0.5,
                            lineHeight: 1.1,
                            gap: 0.4,
                            animation: blinkStyle, // NEW: blink based on level
                        }}
                    >
                        <FlagRoundedIcon fontSize="small" />
                        {actionLabel}
                    </Button>
                </Tooltip>
            )}
        </Box>
    );
}
