'use client';
export default function ScorePanel({
    score, level, streak, mult,
}: { score: number; level: number; streak: number; mult: number; }) {
    return (
        <div className="grid grid-cols-4 gap-3 text-sm">
            <div className="rounded bg-white/5 p-2">Score<br /><b>{score}</b></div>
            <div className="rounded bg-white/5 p-2">Nivel<br /><b>{level}</b></div>
            <div className="rounded bg-white/5 p-2">Streak<br /><b>{streak}</b></div>
            <div className="rounded bg-white/5 p-2">xMult<br /><b>{mult}x</b></div>
        </div>
    );
}
