// src/app/results/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import { getLastResult } from '@/lib/storage/highscores';

type Cause = 'beast' | 'surrender' | 'win' | 'timeout' | 'energy' | undefined;

// Shape we expect from local storage (what getLastResult() returns)
type StoredResult = {
    score: number;
    accuracy: number;
    level: number;
    streakMax: number;
    cause?: Cause;
} | null;

type Last = {
    score: number;
    accuracy: number;
    level: number;
    streakMax: number;
    /** Optional: why the run ended. If 'beast', show special defeat heading. */
    cause?: Cause;
} | null;

type Outcome = {
    heading: string;
    message: string;
    tone: 'fail' | 'hero' | 'master';
    icon: string; // simple emoji/icon
};

/** Decide narrative outcome by level/cause. */
function outcomeFor(level: number, cause?: Cause): Outcome {
    // NEW: hard defeat by the Beast (energy wiped by the beast without destroying it)
    if (cause === 'beast') {
        return {
            heading: 'You were destroyed by the Beast',
            message:
                'The creature drained all your energy before you could unleash it against her. Gather your power and try again.',
            tone: 'fail',
            icon: '💀',
        };
    }

    // Legacy outcomes by level
    if (level <= 2) {
        return {
            heading: 'Energy Insufficient',
            message:
                'Your energy faltered. The Guardians cannot rise yet — train your rhythm and return to aid them.',
            tone: 'fail',
            icon: '🛡️',
        };
    }
    if (level === 3) {
        return {
            heading: 'The Guardians Awaken',
            message:
                'Thank you for your energy. With this strength we can face the beasts — the battle lines are drawn.',
            tone: 'hero',
            icon: '⚔️',
        };
    }
    return {
        heading: 'Master of Signs',
        message:
            'Epic dark fantasy vibes: your command of the Signs is unmatched. The shadows recoil before your light — legend in the making.',
        tone: 'master',
        icon: '✨',
    };
}

/** Tone-based classes for a stylized, legible epic heading. */
function toneHeadingClasses(tone: Outcome['tone']): string {
    // Gradient text + strong drop shadow for readability over dark art
    if (tone === 'master') {
        // gold -> ember
        return [
            'bg-gradient-to-r from-[color:var(--fx-gold)] via-amber-300 to-orange-400',
            'bg-clip-text text-transparent',
            'drop-shadow-[0_0_12px_rgba(255,180,64,0.35)]',
        ].join(' ');
    }
    if (tone === 'hero') {
        // cyan -> teal
        return [
            'bg-gradient-to-r from-[color:var(--fx-cyan)] via-sky-300 to-teal-200',
            'bg-clip-text text-transparent',
            'drop-shadow-[0_0_12px_rgba(0,196,255,0.35)]',
        ].join(' ');
    }
    // fail: steel -> crimson
    return [
        'bg-gradient-to-r from-[color:var(--fx-steel)] via-zinc-300 to-rose-300',
        'bg-clip-text text-transparent',
        'drop-shadow-[0_0_10px_rgba(255,64,64,0.25)]',
    ].join(' ');
}

/** Subheading/message tone. Keep subtle but themed. */
function toneMessageClasses(tone: Outcome['tone']): string {
    if (tone === 'master') return 'text-amber-200/90';
    if (tone === 'hero') return 'text-cyan-200/90';
    return 'text-[color:var(--fx-steel)]';
}

export default function ResultsPage() {
    const [data, setData] = useState<Last>(null);

    useEffect(() => {
        const r = getLastResult() as StoredResult; // <- typed, no 'any'
        if (r) {
            // Optional search param override (?cause=beast)
            const sp = new URLSearchParams(window.location.search);
            const qp = sp.get('cause') as Cause | null;

            setData({
                score: r.score,
                accuracy: r.accuracy,
                level: r.level,
                streakMax: r.streakMax,
                cause: (qp ?? r.cause) as Cause,
            });
        }
    }, []);

    const outcome = data ? outcomeFor(data.level, data.cause) : null;

    return (
        <main className="min-h-screen text-white witcher-app">
            <AppHeader />
            {/* offset for fixed header */}
            <div className="h-16 md:h-20" />

            <section className="mx-auto play-wrap px-4 md:px-6 py-8 md:py-10">
                {/* Stylized dynamic title */}
                <div className="mb-4">
                    <h1 className="witcher-title text-3xl md:text-4xl flex items-center gap-3">
                        {outcome ? (
                            <>
                                <span aria-hidden className="text-2xl md:text-3xl">{outcome.icon}</span>
                                <span className={toneHeadingClasses(outcome.tone)}>{outcome.heading}</span>
                            </>
                        ) : (
                            'Result'
                        )}
                    </h1>
                </div>

                {/* Empty state */}
                {!data && (
                    <div className="witcher-panel p-6 md:p-7">
                        <p className="text-sm text-[color:var(--fx-steel)]">Play a round to see your summary.</p>
                        <div className="mt-4">
                            <Link href="/play" className="btn-witcher">Play</Link>
                        </div>
                    </div>
                )}

                {/* Result summary */}
                {data && outcome && (
                    <div className="witcher-panel p-6 md:p-7">
                        {/* Outcome/narrative line */}
                        <p className={`mb-5 text-sm md:text-base ${toneMessageClasses(outcome.tone)}`}>
                            {outcome.message}
                        </p>

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
