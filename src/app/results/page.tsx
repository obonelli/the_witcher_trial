// src/app/results/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import { getLastResult } from '@/lib/storage/highscores';

type Last = { score: number; accuracy: number; level: number; streakMax: number } | null;

export default function ResultsPage() {
    const [data, setData] = useState<Last>(null);

    useEffect(() => {
        const r = getLastResult();
        if (r) setData({ score: r.score, accuracy: r.accuracy, level: r.level, streakMax: r.streakMax });
    }, []);

    return (
        <main className="min-h-screen text-white witcher-app">
            <AppHeader />
            {/* offset for fixed header */}
            <div className="h-16 md:h-20" />

            <section className="mx-auto play-wrap px-4 md:px-6 py-8 md:py-10">
                <h1 className="witcher-title text-3xl md:text-4xl mb-4">Result</h1>

                {/* Empty state */}
                {!data && (
                    <div className="witcher-panel p-6 md:p-7">
                        <p className="text-sm text-[color:var(--fx-steel)]">
                            Play a round to see your summary.
                        </p>
                        <div className="mt-4">
                            <Link href="/play" className="btn-witcher">Play</Link>
                        </div>
                    </div>
                )}

                {/* Result summary */}
                {data && (
                    <div className="witcher-panel p-6 md:p-7">
                        {/* Header row */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <span className="text-sm text-[color:var(--fx-steel)]">Your score</span>
                                <div className="witcher-score text-[clamp(28px,6vw,56px)] leading-none mt-1">
                                    {data.score}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link href="/play" className="btn-witcher">Retry</Link>
                                {/* Keep your existing component; it renders its own button */}
                                {/* <ShareLinkedIn score={data.score} level={data.level} /> */}
                            </div>
                        </div>

                        {/* Stats grid */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="frame-metal p-4">
                                <div className="text-xs text-[color:var(--fx-steel)] mb-1">Accuracy</div>
                                <div className="text-lg font-bold">{Math.round(data.accuracy * 100)}%</div>
                            </div>
                            <div className="frame-metal p-4">
                                <div className="text-xs text-[color:var(--fx-steel)] mb-1">Level reached</div>
                                <div className="text-lg font-bold">{data.level}</div>
                            </div>
                            <div className="frame-metal p-4">
                                <div className="text-xs text-[color:var(--fx-steel)] mb-1">Max streak</div>
                                <div className="text-lg font-bold">{data.streakMax}</div>
                            </div>
                            <div className="frame-metal p-4">
                                <div className="text-xs text-[color:var(--fx-steel)] mb-1">Mode</div>
                                <div className="text-lg font-bold">Reflex</div>
                            </div>
                        </div>

                        {/* Tip */}
                        <p className="mt-5 text-xs text-[color:var(--fx-steel)]">
                            Tip: Focus on the rhythm — anticipate the next glyph instead of waiting to see it fully lit.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}
