// src/utils/share.ts

// Build a LinkedIn share URL (LinkedIn solo usa "url")
export function buildLinkedInShare(
    opts: { url?: string } & Record<string, unknown>
) {
    const base = 'https://www.linkedin.com/sharing/share-offsite/?';
    const params = new URLSearchParams();

    if (opts.url) params.set('url', opts.url);

    return `${base}${params.toString()}`;
}

// Compose a short text for the post
export function composeResultText({
    score,
    level,
}: {
    score: number;
    level: number;
}) {
    return `Built a playable mini-game in 24h: Witcher-vibes with original glyphs 🔮
Score: ${score} • Level: ${level}
Next: Google Sign-In + global leaderboard.

#GameDev #Web #Nextjs #TypeScript #Tailwind`;
}
