// src/app/highscores/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import { getHighscores, type HighscoreItem } from '@/lib/storage/highscores';
import Link from 'next/link';

export default function HighscoresPage() {
    const [highs, setHighs] = useState<HighscoreItem[]>([]);

    useEffect(() => {
        setHighs(getHighscores());
    }, []);

    const rows = useMemo(
        () => highs.map((h, i) => ({ ...h, rank: i + 1 })).slice(0, 5), // ← only Top 5
        [highs]
    );

    return (
        <main className="min-h-screen text-white witcher-app">
            <AppHeader />
            {/* offset for fixed header */}
            <div className="h-16 md:h-20" />

            <section className="mx-auto play-wrap px-4 md:px-6 py-8 md:py-10">
                <h1 className="witcher-title text-3xl md:text-4xl mb-4">
                    Top 5 Highscores <span className="text-[color:var(--fx-steel)]">(local)</span>
                </h1>

                {/* Empty state */}
                {rows.length === 0 && (
                    <div className="witcher-panel p-5 md:p-6">
                        <p className="text-sm text-[color:var(--fx-steel)]">
                            No scores yet. Play a round and set your first record.
                        </p>
                        <div className="mt-4">
                            <Link href="/play" className="btn-witcher">Play</Link>
                        </div>
                    </div>
                )}

                {/* List (Top 5) */}
                {rows.length > 0 && (
                    <ul className="mt-3 space-y-2">
                        {rows.map((h) => (
                            <li
                                key={`${h.ts}-${h.rank}`}
                                className="
                  witcher-panel
                  px-3 md:px-4 py-3
                  hover:shadow-[0_14px_22px_rgba(0,0,0,.45)]
                  transition-shadow
                "
                            >
                                <div className="flex items-center gap-3 md:gap-4">
                                    {/* Rank badge */}
                                    <div className="shrink-0 rounded-full border border-[rgba(212,175,55,.35)] px-3 py-1 text-xs text-[color:var(--fx-gold)]">
                                        #{h.rank}
                                    </div>

                                    {/* Score + meta */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 items-center w-full gap-2 md:gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <span className="text-sm text-[color:var(--fx-steel)] mr-1">Score:</span>
                                            <b className="witcher-score text-[clamp(16px,2.2vw,20px)] align-middle">{h.score}</b>
                                        </div>

                                        <div>
                                            <span className="text-sm text-[color:var(--fx-steel)] mr-1">Accuracy:</span>
                                            <b>{Math.round(h.accuracy * 100)}%</b>
                                        </div>

                                        <div>
                                            <span className="text-sm text-[color:var(--fx-steel)] mr-1">Level:</span>
                                            <b>{h.level}</b>
                                        </div>

                                        <div className="text-xs text-[color:var(--fx-steel)] justify-self-end hidden md:block">
                                            {new Date(h.ts).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <p className="mt-6 text-sm text-[color:var(--fx-steel)]">
                    Coming soon: global leaderboard (Google Sign-In).
                </p>
            </section>
        </main>
    );
}
