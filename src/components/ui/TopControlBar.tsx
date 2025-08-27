'use client';

import { ReactNode, useEffect } from 'react';
import { Box, Stack, Typography, Tooltip, IconButton, Button } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';

type Props = {
    status: ReactNode;
    helpText?: ReactNode;
    onStart?: () => void;
    startDisabled?: boolean;
};

export default function TopControlBar({ status, helpText, onStart, startDisabled }: Props) {
    // Optional: quick keyboard shortcut (Space) to start
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (startDisabled) return;
            if (e.code === 'Space') {
                e.preventDefault();
                onStart?.();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onStart, startDisabled]);

    return (
        <Box sx={{ mb: 1 }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={2}
                sx={{ minHeight: 40 }}
            >
                {/* Left: status + (i) */}
                <Stack
                    direction="row"
                    alignItems="center"
                    gap={1}
                    sx={{ minWidth: 260, flex: 1, overflow: 'hidden' }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgba(255,255,255,0.85)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                        aria-live="off"
                    >
                        {status}
                    </Typography>

                    {helpText ? (
                        <Tooltip
                            title={
                                <Box sx={{ p: 0.5 }}>
                                    <Typography variant="body2" sx={{ color: 'white' }}>
                                        {helpText}
                                    </Typography>
                                </Box>
                            }
                            placement="right"
                            arrow
                        >
                            <IconButton
                                size="small"
                                sx={{ color: 'rgba(255,255,255,0.85)' }}
                                aria-label="Show help"
                            >
                                <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    ) : null}
                </Stack>

                {/* Right: Start (high-contrast gold) */}
                <Button
                    onClick={onStart}
                    className={`btn-start-danger ${startDisabled ? 'is-disabled' : ''}`}
                    color="inherit"
                    sx={{ fontFamily: 'Cinzel, serif' }}
                    title="Start (Space)"
                    aria-label="Start run"
                >
                    <FlashOnRoundedIcon fontSize="small" />
                    Start
                    <span className="hotkey">Space</span>
                </Button>

            </Stack>
        </Box>
    );
}
