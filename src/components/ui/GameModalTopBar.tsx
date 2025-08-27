'use client';

import { Box, Button, Tooltip } from '@mui/material';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';

export default function GameModalTopBar({
    paused,
    onTogglePause,
    onSurrender,
    isMobile,
}: {
    paused: boolean;
    onTogglePause: () => void;
    onSurrender?: () => void;
    isMobile?: boolean;
}) {
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
                        gap: .4,
                    }}
                >
                    {paused ? <PlayArrowRoundedIcon fontSize="small" /> : <PauseRoundedIcon fontSize="small" />}
                    {paused ? 'Resume' : 'Pause'}
                </Button>
            </Tooltip>

            {/* Surrender */}
            {onSurrender && (
                <Tooltip title="Surrender (Esc)" arrow>
                    <Button
                        size="small"
                        onClick={onSurrender}
                        className="btn-danger"
                        sx={{
                            textTransform: 'none',
                            fontFamily: 'Cinzel, serif',
                            minWidth: isMobile ? 0 : 104,
                            px: isMobile ? 1 : 1.25,
                            py: 0.5,
                            lineHeight: 1.1,
                            gap: .4,
                        }}
                    >
                        <FlagRoundedIcon fontSize="small" />
                        Surrender
                    </Button>
                </Tooltip>
            )}
        </Box>
    );
}
