// src/lib/audio.ts

// Simple audio cache + mute flag + global guard
let muted = false;
let sfxArmed = false; // ⛔ blocks any sound if false
const cache: Record<string, HTMLAudioElement> = {};

// Persist setting in localStorage
const MUTE_KEY = 'WST:mute';
export function isMuted() {
    if (typeof window === 'undefined') return muted;
    const raw = localStorage.getItem(MUTE_KEY);
    return raw ? raw === '1' : muted;
}
export function setMuted(v: boolean) {
    muted = v;
    if (typeof window !== 'undefined') {
        localStorage.setItem(MUTE_KEY, v ? '1' : '0');
    }
}

// 👉 global control to allow SFX only during player's turn
export function setSfxArmed(armed: boolean) {
    sfxArmed = armed;
}
export function isSfxArmed() {
    return sfxArmed;
}

/** Return candidates: respect given extension or try mp3 then wav */
function buildCandidates(url: string): string[] {
    const m = url.match(/\.(mp3|wav)$/i);
    if (!m) return [`${url}.mp3`, `${url}.wav`];
    const ext = m[1].toLowerCase();
    const alt = ext === 'mp3' ? url.replace(/\.mp3$/i, '.wav') : url.replace(/\.wav$/i, '.mp3');
    return [url, alt];
}

/** Load one candidate; resolve if it can play, reject otherwise */
function loadAudioOnce(src: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
        const a = new Audio();
        a.preload = 'auto';
        a.src = src;

        const cleanup = () => {
            a.removeEventListener('canplaythrough', onOK);
            a.removeEventListener('error', onErr);
        };
        const onOK = () => { cleanup(); resolve(a); };
        const onErr = () => { cleanup(); reject(new Error('load error')); };

        a.addEventListener('canplaythrough', onOK, { once: true });
        a.addEventListener('error', onErr, { once: true });
        a.load();
    });
}

/** Try candidates (mp3 → wav). Cache the first playable element. */
async function getPlayable(url: string): Promise<HTMLAudioElement | null> {
    if (cache[url]) return cache[url];
    const candidates = buildCandidates(url);
    for (const src of candidates) {
        try {
            const el = await loadAudioOnce(src);
            cache[url] = el; // cache under the original key
            return el;
        } catch {
            // try next
        }
    }
    return null;
}

/* ====== Hard cut with soft fade (max 1.5s) ============================ */

/** Max allowed duration for any SFX (ms) */
const CUT_MAX_MS = 1500;
/** Fade-out duration at the end (ms) */
const FADE_MS = 140;
/** Track per-element timeout IDs so repeated plays don't stack */
const cutTimers = new WeakMap<HTMLAudioElement, number>();

/** Schedule a cutoff with a short fade to avoid clicks/pops */
function scheduleCutoff(el: HTMLAudioElement) {
    if (typeof window === 'undefined') return;

    // clear previous scheduled cutoff for this element
    const prev = cutTimers.get(el);
    if (prev) clearTimeout(prev);

    // ensure volume starts at 1 for a consistent fade
    try { el.volume = 1; } catch { /* ignore */ }

    const startFadeIn = Math.max(0, CUT_MAX_MS - FADE_MS);

    const id = window.setTimeout(() => {
        const t0 = performance.now();
        const step = () => {
            const dt = performance.now() - t0;
            const r = Math.min(1, dt / FADE_MS);
            try { el.volume = 1 - r; } catch { /* ignore */ }
            if (r < 1) {
                requestAnimationFrame(step);
            } else {
                try {
                    el.pause();
                    el.currentTime = 0;
                    el.volume = 1; // ready for the next play
                } catch { /* ignore */ }
            }
        };
        requestAnimationFrame(step);
    }, startFadeIn);

    cutTimers.set(el, id);
}

/* ======================= Public API =================================== */

/** Works with '/assets/sfx/gale' or '/assets/sfx/gale.mp3' */
export async function playSfx(url: string) {
    if (typeof window === 'undefined') return;
    if (isMuted()) return;
    if (!isSfxArmed()) return; // 🔒 do not play if not armed

    try {
        const el = await getPlayable(url);
        if (!el) return;

        // clear any pending cutoff from a previous play
        const prev = cutTimers.get(el);
        if (prev) clearTimeout(prev);

        try { el.currentTime = 0; } catch { /* ignore */ }
        try { el.volume = 1; } catch { /* ignore */ }
        await el.play();

        // enforce max duration with a soft fade
        scheduleCutoff(el);
    } catch {
        // ignore (autoplay policy, etc.)
    }
}
