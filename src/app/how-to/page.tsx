// src/app/how-to/page.tsx
import AppHeader from '@/components/layout/AppHeader';
import Image from 'next/image';
import { GLYPHS } from '@/config/glyphs';

const SPIRITS: Record<string, { name: string; blurb: string }> = {
    gale: { name: 'Griffin', blurb: 'Wind and swiftness. A cutting gust that staggers foes.' },
    ember: { name: 'Dragon', blurb: 'Fire and fury. A searing burst that scorches the front.' },
    ward: { name: 'Bear', blurb: 'Shield and endurance. A bulwark that turns blows aside.' },
    snare: { name: 'Viper', blurb: 'Control and traps. A binding strike that halts the charge.' },
    soothe: { name: 'Stag', blurb: 'Calm and clarity. A soothing pulse that steadies the hunt.' },
    void: { name: 'Raven', blurb: 'Shadow and silence. A chill that saps the enemy’s will.' },
};

export default function HowToPage() {
    return (
        <main className="text-white witcher-app">
            <AppHeader />
            {/* offset for fixed header */}
            <div className="h-16 md:h-20" />

            <section className="mx-auto play-wrap px-4 md:px-6 py-10 md:py-14 space-y-6">
                <div className="max-w-3xl">
                    <h2 className="witcher-title text-3xl md:text-4xl">How to play</h2>
                    <ul className="list-disc pl-6 text-sm text-[color:var(--fx-steel)] mt-3 space-y-1.5">
                        <li>Watch the glowing glyph — only one lights up at a time.</li>
                        <li>Tap the matching glyph before your energy drains.</li>
                        <li>Correct hits restore a bit of energy and build your combo; wrong taps drain extra energy.</li>
                        <li>Each stage shrinks the timing window and increases score per hit.</li>
                        <li>Your latest run and highscores are saved locally.</li>
                    </ul>
                    <p className="mt-2 text-xs text-[color:var(--fx-steel)]">
                        Theme: every glyph releases the power of an <strong>animal spirit</strong>. As spirits gather, they aid Geralt in the fight.
                    </p>
                </div>

                {/* The Signs / Spirits */}
                <div className="mt-6">
                    <h3 className="witcher-title text-2xl mb-3">The Signs</h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {GLYPHS.map((g) => {
                            const spirit = SPIRITS[g.id] ?? { name: 'Unknown', blurb: 'A forgotten echo from the Path.' };
                            return (
                                <div key={g.id} className="witcher-panel p-3 flex flex-col items-center text-center">
                                    {/* base icon */}
                                    <div className="relative w-16 h-16">
                                        <Image
                                            src={g.png}
                                            alt={`${g.name} glyph`}
                                            fill
                                            sizes="64px"
                                            className="object-contain"
                                        />
                                    </div>

                                    {/* active preview if available */}
                                    {g.pngActive && (
                                        <div className="relative w-16 h-16 mt-2">
                                            <Image
                                                src={g.pngActive}
                                                alt={`${g.name} active`}
                                                fill
                                                sizes="64px"
                                                className="object-contain"
                                            />
                                        </div>
                                    )}

                                    <div className="mt-2">
                                        <div className="font-semibold">{g.name}</div>
                                        <div className="text-xs text-[color:var(--fx-steel)]">
                                            Spirit: {spirit.name}
                                        </div>
                                    </div>

                                    <p className="mt-1 text-xs text-[color:var(--fx-steel)]">
                                        {spirit.blurb}
                                    </p>

                                    {/* note about SFX idea */}
                                    <p className="mt-1 text-[10px] opacity-75 text-[color:var(--fx-steel)]">
                                        On activation: play a {spirit.name.toLowerCase()}-like roar/call.
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <p className="mt-3 text-xs text-[color:var(--fx-steel)]">
                        Tip: Keep a steady rhythm — anticipate the next glow instead of waiting for it to peak.
                    </p>
                </div>

                {/* Keybinds (compact) */}
                <div className="witcher-panel p-4 md:p-5 mt-4">
                    <h4 className="witcher-title text-xl mb-2">Keybinds</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[color:var(--fx-steel)]">
                        <li><strong>Space</strong> — Start</li>
                        <li><strong>P</strong> — Pause/Resume</li>
                        <li><strong>Esc</strong> — Surrender</li>
                    </ul>
                    <p className="mt-2 text-xs text-[color:var(--fx-steel)]">
                        Note: Keys 1–5 are available, but this mode encourages tapping the glyph directly.
                    </p>
                </div>
            </section>

            {/* reduce bottom spacing to avoid reaching the very edge */}
            <div className="pb-8 md:pb-10" />
        </main>
    );
}
