// Local highscores storage helpers

export type HighscoreItem = {
    score: number;
    accuracy: number; // 0..1
    level: number;
    streakMax: number;
    ts: number; // epoch ms
};

const KEY = 'WST:highscores';

// Read top-10 list (sorted desc by score)
export function getHighscores(): HighscoreItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as HighscoreItem[]) : [];
    } catch {
        return [];
    }
}

// Insert a new score and keep only top-10
export function saveHighscore(item: HighscoreItem) {
    if (typeof window === 'undefined') return;
    const arr = [...getHighscores(), item]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    try {
        localStorage.setItem(KEY, JSON.stringify(arr));
    } catch { }
}

// === Last game result (to render /results) ===
const LAST_KEY = 'WST:lastResult';

export type LastResult = HighscoreItem;

export function saveLastResult(r: LastResult) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(LAST_KEY, JSON.stringify(r));
    } catch { }
}

export function getLastResult(): LastResult | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(LAST_KEY);
        return raw ? (JSON.parse(raw) as LastResult) : null;
    } catch {
        return null;
    }
}
