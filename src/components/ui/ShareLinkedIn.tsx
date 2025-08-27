'use client';

import { buildLinkedInShare, composeResultText } from '@/utils/share';

type Props = {
    score: number;
    level: number;
    targetUrl?: string;
};

export default function ShareLinkedIn({
    score,
    level,
    targetUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: Props) {
    const text = composeResultText({ score, level });
    // buildLinkedInShare acepta text aunque no lo use internamente
    const shareUrl = buildLinkedInShare({ text, url: targetUrl });

    // Copy text to clipboard then open LinkedIn share URL
    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Ignore clipboard errors; user can still paste manually
        }
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <button
            className="rounded border border-white/10 px-4 py-2 hover:bg-white/10"
            onClick={handleShare}
            title="Copies the post text and opens LinkedIn share dialog"
        >
            Share on LinkedIn
        </button>
    );
}
