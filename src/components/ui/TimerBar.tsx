'use client';

export default function TimerBar({ progress, paused = false }: { progress: number; paused?: boolean }) {
    // progress: 0..1
    const pct = Math.max(0, Math.min(1, progress)) * 100;
    return (
        <div className="h-2 w-full rounded bg-white/10">
            <div
                className="h-2 rounded bg-amber-400 transition-[width] duration-150"
                style={{
                    width: `${pct}%`,
                    // a tiny visual hint that it's paused
                    opacity: paused ? 0.6 : 1,
                }}
            />
        </div>
    );
}
