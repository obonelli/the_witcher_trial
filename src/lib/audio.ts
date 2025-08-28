// src/lib/audio.ts
// Audio utilities: SFX cache + BGM singleton (Strict-Mode safe)

// ===== Global state ======================================================
let muted = false;
let sfxArmed = false; // gate to allow sfx during player's turn only

// Cache for SFX players by normalized absolute key (no extension)
const cache: Record<string, HTMLAudioElement> = Object.create(null);

// LocalStorage key for mute preference
const MUTE_KEY = 'WST:mute';

// BGM singleton stored on window to survive React Strict Mode remounts
declare global {
    interface Window {
        __bgm?: HTMLAudioElement;
        __bgmStarting?: boolean; // simple reentrancy/collision guard
    }
}

// ===== Mute/helpers ======================================================
export function isMuted() {
    if (typeof window === 'undefined') return muted;
    const raw = localStorage.getItem(MUTE_KEY);
    return raw ? raw === '1' : muted;
}

export function setMuted(v: boolean) {
    muted = v;
    if (typeof window !== 'undefined') {
        localStorage.setItem(MUTE_KEY, v ? '1' : '0');
        // Reflect immediately on the BGM element if it exists
        const bgm = window.__bgm;
        if (bgm) {
            try {
                if (v) {
                    bgm.pause();
                } else {
                    // keep volume as configured; just attempt resume
                    bgm.play().catch(() => { /* ignore autoplay block */ });
                }
            } catch {
                // ignore
            }
        }
    }
}

export function setSfxArmed(armed: boolean) {
    sfxArmed = armed;
}
export function isSfxArmed() {
    return sfxArmed;
}

// ===== URL normalization =================================================
function absUrl(path: string): string {
    if (typeof window === 'undefined') return path;
    // Make absolute (handles both "/x/y.mp3" and "x/y.mp3")
    return new URL(path, window.location.origin).toString();
}

// Normalize cache key to "absolute URL without extension"
function sfxCacheKey(url: string): string {
    const abs = absUrl(url);
    return abs.replace(/\.(mp3|wav)$/i, '');
}

/** Return candidates: respect given extension or try mp3 then wav */
function buildCandidates(url: string): string[] {
    const m = url.match(/\.(mp3|wav)$/i);
    if (!m) return [`${url}.mp3`, `${url}.wav`];
    const ext = m[1].toLowerCase();
    const alt =
        ext === 'mp3' ? url.replace(/\.mp3$/i, '.wav') : url.replace(/\.wav$/i, '.mp3');
    return [url, alt];
}

/** Load one candidate; resolve if it can play, reject otherwise */
function loadAudioOnce(src: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
        const a = new Audio();
        a.preload = 'auto';
        a.src = absUrl(src);

        const cleanup = () => {
            a.removeEventListener('canplaythrough', onOK);
            a.removeEventListener('error', onErr);
        };
        const onOK = () => {
            cleanup();
            resolve(a);
        };
        const onErr = () => {
            cleanup();
            reject(new Error('load error'));
        };

        a.addEventListener('canplaythrough', onOK, { once: true });
        a.addEventListener('error', onErr, { once: true });
        a.load();
    });
}

/** Try candidates (mp3 → wav). Cache the first playable element. */
async function getPlayable(url: string): Promise<HTMLAudioElement | null> {
    const key = sfxCacheKey(url);
    if (cache[key]) return cache[key];

    const candidates = buildCandidates(url);
    for (const src of candidates) {
        try {
            const el = await loadAudioOnce(src);
            cache[key] = el; // cache under normalized key
            return el;
        } catch {
            // try next candidate
        }
    }
    return null;
}

// ===== Hard cut with soft fade (max 1.5s) ================================
const CUT_MAX_MS = 1500; // max allowed duration for any SFX (ms)
const FADE_MS = 140; // fade-out duration at the end (ms)
const cutTimers = new WeakMap<HTMLAudioElement, number>(); // per-element timeouts

/** Schedule a cutoff with a short fade to avoid clicks/pops */
function scheduleCutoff(el: HTMLAudioElement) {
    if (typeof window === 'undefined') return;

    // Clear previous scheduled cutoff for this element
    const prev = cutTimers.get(el);
    if (prev) clearTimeout(prev);

    try {
        el.volume = 1;
    } catch {
        /* ignore */
    }

    const startFadeIn = Math.max(0, CUT_MAX_MS - FADE_MS);

    const id = window.setTimeout(() => {
        const t0 = performance.now();
        const step = () => {
            const dt = performance.now() - t0;
            const r = Math.min(1, dt / FADE_MS);
            try {
                el.volume = 1 - r;
            } catch {
                /* ignore */
            }
            if (r < 1) {
                requestAnimationFrame(step);
            } else {
                try {
                    el.pause();
                    el.currentTime = 0;
                    el.volume = 1; // ready for the next play
                } catch {
                    /* ignore */
                }
            }
        };
        requestAnimationFrame(step);
    }, startFadeIn);

    cutTimers.set(el, id);
}

// ===== Public SFX API ====================================================

/** Works with '/assets/sfx/gale' or '/assets/sfx/gale.mp3' */
export async function playSfx(url: string) {
    if (typeof window === 'undefined') return;
    if (isMuted()) return;
    if (!isSfxArmed()) return; // gate

    try {
        const el = await getPlayable(url);
        if (!el) return;

        // Clear any pending cutoff from a previous play
        const prev = cutTimers.get(el);
        if (prev) clearTimeout(prev);

        try {
            el.currentTime = 0;
        } catch {
            /* ignore */
        }
        try {
            el.volume = 1; // keep SFX punchy
        } catch {
            /* ignore */
        }
        await el.play();

        // Enforce max duration with a soft fade
        scheduleCutoff(el);
    } catch {
        // ignore (autoplay policy, etc.)
    }
}

/** Optional helper to rate-limit accidental double triggers */
let lastSfxAt = 0;
export function playSfxOnce(url: string, cooldownMs = 40) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - lastSfxAt > cooldownMs) {
        lastSfxAt = now;
        void playSfx(url);
    }
}

// ===== BGM singleton (Strict Mode safe) ==================================
// Lower default to avoid overpowering SFX
const DEFAULT_BGM_VOL = 0.22;

function ensureBgm(src: string, volume = DEFAULT_BGM_VOL, loop = true) {
    if (typeof window === 'undefined') return undefined;

    const url = absUrl(src);
    let el = window.__bgm;

    if (!el) {
        el = new Audio(url);
        el.loop = loop;
        el.preload = 'auto';
        el.volume = volume;
        window.__bgm = el;
    } else {
        // Always normalize properties; if changing track, pause first
        if (el.src !== url) {
            try { el.pause(); } catch { /* ignore */ }
            el.src = url;
            try { el.currentTime = 0; } catch { /* ignore */ }
        }
        el.loop = loop;
        el.volume = volume;
    }

    return el;
}

/** Start or resume BGM. No-op if muted. Idempotent: avoids double playback. */
export function playBgm(src: string, opts?: { volume?: number; loop?: boolean }) {
    const vol = opts?.volume ?? DEFAULT_BGM_VOL;
    const loop = opts?.loop ?? true;

    const el = ensureBgm(src, vol, loop);
    if (!el) return;

    // If muted, ensure paused and bail
    if (isMuted()) {
        try { el.pause(); } catch { /* ignore */ }
        return;
    }

    // Prevent re-entrant .play() races
    if (typeof window !== 'undefined' && window.__bgmStarting) return;

    // Idempotent behavior:
    // - Same src & already playing => just update volume/loop; don't call play()
    // - Same src & paused => resume once
    // - Different src => paused above, set src, reset time, then play once
    const sameSrc = el.src === absUrl(src);
    const alreadyPlaying = !el.paused && !el.ended;

    try {
        el.volume = vol;
        el.loop = loop;
    } catch { /* ignore */ }

    if (sameSrc && alreadyPlaying) {
        // Nothing else to do; avoid second concurrent playback
        return;
    }

    if (sameSrc && el.paused) {
        window.__bgmStarting = true;
        el.play().catch(() => { /* ignore autoplay */ }).finally(() => {
            if (typeof window !== 'undefined') window.__bgmStarting = false;
        });
        return;
    }

    // Different source path: currentTime was reset in ensureBgm; play once
    window.__bgmStarting = true;
    el.play().catch(() => { /* ignore autoplay */ }).finally(() => {
        if (typeof window !== 'undefined') window.__bgmStarting = false;
    });
}

/** Stop BGM and reset to the beginning. */
export function stopBgm() {
    if (typeof window === 'undefined') return;
    const el = window.__bgm;
    if (!el) return;
    try {
        el.pause();
        el.currentTime = 0;
    } catch {
        /* ignore */
    }
}

/** Adjust BGM volume (0..1). */
export function setBgmVolume(v: number) {
    if (typeof window === 'undefined') return;
    const el = window.__bgm;
    if (!el) return;
    try {
        el.volume = Math.max(0, Math.min(1, v));
    } catch {
        /* ignore */
    }
}

/** Quick status helper. */
export function isBgmPlaying(): boolean {
    if (typeof window === 'undefined') return false;
    const el = window.__bgm;
    return !!el && !el.paused;
}
