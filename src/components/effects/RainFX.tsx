'use client';

import { useEffect, useState, useRef } from 'react';

type Props = {
    /** Minimum seconds between showers */
    minGap?: number;
    /** Maximum seconds between showers */
    maxGap?: number;
    /** Seconds a shower lasts */
    duration?: number;
    /** Force-on (for debugging) */
    forceActive?: boolean;
};

export default function RainFX({
    minGap = 20,
    maxGap = 45,
    duration = 12,
    forceActive,
}: Props) {
    const [active, setActive] = useState<boolean>(!!forceActive);
    const timer = useRef<number | null>(null);

    useEffect(() => {
        if (forceActive !== undefined) {
            setActive(!!forceActive);
            return;
        }

        const prefersReduce =
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        if (prefersReduce) return; // respect accessibility

        const schedule = () => {
            // wait random gap then start rain
            const gap = (Math.random() * (maxGap - minGap) + minGap) * 1000;
            timer.current = window.setTimeout(() => {
                setActive(true);
                // stop after duration, then schedule the next shower
                const stopAt = window.setTimeout(() => {
                    setActive(false);
                    schedule();
                }, duration * 1000);
                timer.current = stopAt;
            }, gap);
        };

        schedule();
        return () => { if (timer.current) window.clearTimeout(timer.current); };
    }, [minGap, maxGap, duration, forceActive]);

    return (
        <div className={`rain-overlay ${active ? 'is-active' : ''}`}>
            <div className="rain-haze" />
            <div className="rain-layer rain-coarse" />
            <div className="rain-layer rain-fine" />
        </div>
    );
}
