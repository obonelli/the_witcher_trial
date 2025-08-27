// src/app/page.tsx
import AppHeader from '@/components/layout/AppHeader';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen text-white witcher-app">
      <AppHeader />
      {/* offset for fixed header */}
      <div className="h-16 md:h-20" />

      {/* ===== HERO ===== */}
      <section className="relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(1200px 520px at 70% 80%, rgba(255,72,0,0.18), transparent 60%), linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))',
          }}
        />
        <div className="relative mx-auto play-wrap px-4 md:px-6 py-12 md:py-20">
          <div className="max-w-3xl">
            <span className="inline-block text-xs tracking-wide text-[color:var(--fx-steel)] mb-2">
              v0.2 • guardian hunt
            </span>

            {/* volvemos al título anterior */}
            <h1 className="witcher-title text-4xl md:text-5xl leading-tight">
              Unleash the <span className="text-[color:var(--fx-gold)]">Guardians</span>, Defy the Beast
            </h1>

            <p className="mt-3 witcher-subtitle max-w-2xl">
              A monstrous presence prowls the forest. Only the ancient animal spirits can tip the scales.
              Channel each Sign at the right moment to summon its guardian—wind, flame, shield, snare, and calm—
              and let their power aid Geralt in the fight. Keep the chain alive; if your energy hits zero,
              the guardians fade and the hunt ends.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link href="/play" className="btn-witcher text-sm">
                Begin the Rite
              </Link>
              <Link href="/how-to" className="btn-witcher-ghost text-sm">
                Learn the Signs
              </Link>
            </div>

            <p className="mt-4 text-xs text-[color:var(--fx-steel)]">
              Tip: Keep a steady rhythm — anticipate the next glow instead of waiting for it to peak.
            </p>
          </div>
        </div>
      </section>

      {/* ===== MISSION ===== */}
      <section className="mx-auto play-wrap px-4 md:px-6 pt-10 md:pt-16 pb-10">
        <div className="witcher-panel pad-sm">
          <h2 className="witcher-title text-2xl mb-2">Your role</h2>
          <ul className="list-disc pl-6 text-sm text-[color:var(--fx-steel)] space-y-1">
            <li>Only one Sign glows at a time — tap it before your energy drains.</li>
            <li>Each correct tap summons a guardian spirit and restores a bit of energy.</li>
            <li>Misses drain extra energy; at 0, the guardians disperse and Geralt loses the edge.</li>
            <li>Higher stages tighten the timing window and increase your score per summon.</li>
          </ul>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="mx-auto play-wrap px-4 md:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="witcher-panel pad-sm">
            <h3 className="witcher-title text-xl mb-1">Reflex & Timing</h3>
            <p className="text-sm text-[color:var(--fx-steel)]">
              React the instant the Sign appears. Smooth rhythm keeps guardians active and the beast at bay.
            </p>
          </div>

          <div className="witcher-panel pad-sm">
            <h3 className="witcher-title text-xl mb-1">Energy & Chain</h3>
            <p className="text-sm text-[color:var(--fx-steel)]">
              Summons refill a sliver of stamina and build your chain. Break it and the spirits weaken.
            </p>
          </div>

          <div className="witcher-panel pad-sm">
            <h3 className="witcher-title text-xl mb-1">Stages & Glory</h3>
            <p className="text-sm text-[color:var(--fx-steel)]">
              Survive waves to climb stages. Faster windows, stronger guardians — carve your name on the board.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
