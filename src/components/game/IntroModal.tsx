'use client';
export default function IntroModal({ onStart }: { onStart?: () => void }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/50 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">¿List@ para invocar los signos?</h2>
            <p className="mb-4 opacity-75">Repite la secuencia de glifos antes de que se acabe el tiempo.</p>
            <button className="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500" onClick={onStart}>Comenzar</button>
        </div>
    );
}
