'use client';

import { Box, LinearProgress, Typography } from '@mui/material';

export default function GameModalHud({
  energy,
  stage,
  score,
  level,
  streak,
  mult,
  isMobile,
}: {
  energy: number;                  // 0..1
  stage: 'countdown' | 'live';
  score: number;
  level: number;
  streak: number;
  mult: number;
  isMobile?: boolean;
}) {
  return (
    <>
      {/* ENERGY BAR (always visible) */}
      <Box sx={{ width: '100%', maxWidth: 700, position: 'relative' }}>
        {/* 50% marker */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: 2,
            transform: 'translateX(-1px)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
            borderRadius: 999,
            pointerEvents: 'none',
          }}
        />
        <LinearProgress
          variant="determinate"
          value={Math.max(0, Math.min(100, energy * 100))}
          sx={{
            height: isMobile ? 10 : 12,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.08)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 999,
              transition: 'width 120ms linear',
              background:
                energy > 0.5
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #f59e0b, #ef4444)',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: 8,
            top: isMobile ? -20 : -22,
            color: 'rgba(255,255,255,0.8)',
            fontSize: isMobile ? 11 : 12,
          }}
        >
          Energy
        </Box>
      </Box>

      {/* Stats row (only after GO) */}
      {stage === 'live' && (
        <Box
          sx={{
            width: '100%',
            maxWidth: 700,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, max-content)' },
            justifyContent: 'center',
            justifyItems: 'center',
            gap: isMobile ? 1 : 2,
            mt: 0.5,
          }}
        >
          {[
            { label: 'Score', value: score },
            { label: 'Nivel', value: level },
            { label: 'Streak', value: streak },
            { label: 'xMult', value: `${mult}x` },
          ].map((s) => (
            <Box
              key={s.label}
              sx={{
                px: isMobile ? 1 : 1.5,
                py: isMobile ? 0.75 : 1,
                borderRadius: 1.2,
                bgcolor: 'rgba(255,255,255,0.06)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)',
                minWidth: isMobile ? 96 : 110,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="caption"
                sx={{ opacity: 0.75, letterSpacing: 0.2, fontSize: isMobile ? 11 : 12 }}
              >
                {s.label}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: isMobile ? 18 : 22,
                  lineHeight: 1.15,
                }}
              >
                {s.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </>
  );
}
