'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { isMuted, setMuted } from '@/lib/audio';
import { usePathname } from 'next/navigation';

export default function AppHeader() {
    const [mute, setMute] = useState<boolean>(true);
    const [volume, setVolume] = useState<number>(0.5);
    const bgmRef = useRef<HTMLAudioElement | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        // init mute state
        setMute(isMuted());

        // init background music
        if (!bgmRef.current) {
            const bg = new Audio('/assets/sfx/background.mp3');
            bg.loop = true;
            bg.volume = 0.5;
            bg.autoplay = true;
            bgmRef.current = bg;
            bg.play().catch(() => {
                // se reproducirá al primer click/interaction
            });
        }
    }, []);

    // keep mute in sync
    useEffect(() => {
        if (bgmRef.current) {
            bgmRef.current.muted = mute;
        }
    }, [mute]);

    // keep volume in sync
    useEffect(() => {
        if (bgmRef.current) {
            bgmRef.current.volume = volume;
        }
    }, [volume]);

    function toggle() {
        setMuted(!mute);
        setMute(!mute);
    }

    function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = Number(e.target.value);
        setVolume(val);
    }

    return (
        <header className="sticky top-0 z-50">
            <nav className="mx-auto play-wrap flex items-center justify-between px-4 py-3 witcher-panel">
                {/* Brand / Title */}
                <Link
                    href="/"
                    className="witcher-title font-semibold tracking-wide text-base md:text-lg"
                >
                    Home
                </Link>

                {/* Navigation */}
                <div className="flex items-center gap-3 text-sm">
                    {/* Sound controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggle}
                            className="btn-witcher-ghost"
                            title="Toggle sound"
                        >
                            {mute ? 'Unmute' : 'Mute'}
                        </button>

                        {/* Volume slider */}
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-24 h-2 accent-[var(--fx-gold)] bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer"
                            title="Volume"
                        />
                    </div>

                    <Link href="/how-to" className="btn-witcher-ghost">
                        How to play
                    </Link>

                    <Link href="/highscores" className="btn-witcher-ghost">
                        Highscores
                    </Link>

                    {/* Hide button if we are already in /play */}
                    {pathname !== '/play' && (
                        <Link href="/play" className="btn-witcher">
                            Begin the Rite
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
}
