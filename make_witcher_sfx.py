# make_witcher_sfx.py
# Generates Witcher-style SFX as MP3 (320 kbps), saves into ./public/assets/sfx and zips them.
# Requirements:
#   pip install numpy pydub
# Also requires ffmpeg installed and on PATH to export MP3 with pydub.
# If ffmpeg is missing, the script will fall back to WAV and warn you.

import os
import io
import zipfile
import shutil
import math
import random
import warnings
from typing import Callable

import numpy as np
from pydub import AudioSegment, effects


# ----------------------------
# Config
# ----------------------------
SAMPLE_RATE = 44100
BIT_DEPTH = 16  # 16-bit PCM
CHANNELS = 2  # stereo
TARGET_DIR = os.path.join(".", "public", "assets", "sfx")
BITRATE = "320k"  # epic quality
DURATION_S = {
    "gale": 0.9,
    "ember": 0.9,
    "ward": 0.9,
    "snare": 0.6,
    "soothe": 1.1,
    "void": 1.0,
    "aegis": 1.1,
}


# ----------------------------
# Low-level audio helpers
# ----------------------------
def _ensure_dirs():
    os.makedirs(TARGET_DIR, exist_ok=True)


def _to_stereo(x: np.ndarray) -> np.ndarray:
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    return x


def _normalize_peak(x: np.ndarray, peak: float = 0.9) -> np.ndarray:
    max_abs = np.max(np.abs(x)) + 1e-12
    return (x / max_abs) * peak


def _fade(
    x: np.ndarray, sr: int, fade_in_s: float = 0.02, fade_out_s: float = 0.05
) -> np.ndarray:
    n = x.shape[0]
    fi = int(sr * fade_in_s)
    fo = int(sr * fade_out_s)
    if fi > 0:
        fade_in = np.linspace(0.0, 1.0, fi)
        x[:fi] *= fade_in[:, None] if x.ndim == 2 else fade_in
    if fo > 0:
        fade_out = np.linspace(1.0, 0.0, fo)
        x[-fo:] *= fade_out[:, None] if x.ndim == 2 else fade_out
    return x


def _apply_lowpass(x: np.ndarray, cutoff_hz: float, sr: int) -> np.ndarray:
    # Simple 1-pole low-pass (real-time friendly; musical, not surgical)
    rc = 1.0 / (2 * math.pi * cutoff_hz)
    dt = 1.0 / sr
    alpha = dt / (rc + dt)
    y = np.zeros_like(x)
    y[0] = x[0]
    for i in range(1, len(x)):
        y[i] = y[i - 1] + alpha * (x[i] - y[i - 1])
    return y


def _apply_highpass(x: np.ndarray, cutoff_hz: float, sr: int) -> np.ndarray:
    # Simple 1-pole high-pass
    rc = 1.0 / (2 * math.pi * cutoff_hz)
    dt = 1.0 / sr
    alpha = rc / (rc + dt)
    y = np.zeros_like(x)
    y[0] = x[0]
    for i in range(1, len(x)):
        y[i] = alpha * (y[i - 1] + x[i] - x[i - 1])
    return y


def _comb_filter(
    x: np.ndarray, delay_ms: float, feedback: float, sr: int
) -> np.ndarray:
    # Simple mono comb filter
    delay_samples = int(sr * delay_ms / 1000.0)
    y = np.copy(x)
    for i in range(delay_samples, len(x)):
        y[i] += feedback * y[i - delay_samples]
    return _normalize_peak(y, 0.9)


def _reverb_simple(
    stereo: np.ndarray, sr: int, decay=0.5, num_taps=4, base_delay_ms=60
) -> np.ndarray:
    # Very lightweight stereo reverb using a few delayed taps
    y = np.copy(stereo)
    for t in range(1, num_taps + 1):
        delay = int(sr * (base_delay_ms * t) / 1000.0)
        gain = decay**t
        pad = np.zeros((delay, 2))
        tail = np.vstack([pad, stereo[:-delay]]) if delay < len(stereo) else pad
        # Slight stereo variation
        y[:, 0] += gain * tail[:, 0]
        y[:, 1] += gain * tail[:, 1] * (0.9 + 0.2 * random.random())
    return _normalize_peak(y, 0.95)


def _np_to_audiosegment(stereo: np.ndarray, sr: int) -> AudioSegment:
    # Expect stereo float32/-1..1
    stereo = np.clip(stereo, -1.0, 1.0)
    int16 = np.int16(stereo * (2**15 - 1))
    raw = int16.tobytes()
    seg = AudioSegment(
        data=raw,
        sample_width=2,  # 16-bit
        frame_rate=sr,
        channels=2,
    )
    return seg


def _export_audio(seg: AudioSegment, path_mp3: str, fallback_wav: bool = True):
    try:
        seg.export(path_mp3, format="mp3", bitrate=BITRATE)
    except Exception as e:
        if fallback_wav:
            warnings.warn(
                f"Failed to export MP3 (ffmpeg missing?). Exporting WAV instead. Error: {e}"
            )
            wav_path = os.path.splitext(path_mp3)[0] + ".wav"
            seg.export(wav_path, format="wav")
        else:
            raise


# ----------------------------
# Synth building blocks
# ----------------------------
def _sine(f, t):
    return np.sin(2 * np.pi * f * t)


def _noise(n):
    return np.random.uniform(-1.0, 1.0, size=n)


def _envelope_ad(t, attack=0.02, decay=0.3, sr=SAMPLE_RATE):
    n = len(t)
    env = np.ones(n)
    a = int(attack * sr)
    d = int(decay * sr)
    if a > 0:
        env[:a] = np.linspace(0, 1, a)
    if d > 0:
        decay_curve = np.linspace(1, 0.2, d)
        end = min(a + d, n)
        env[a:end] = decay_curve[: (end - a)]
    return env


def _bell_tone(duration, base_f=660.0, sr=SAMPLE_RATE):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    partials = [1.0, 2.01, 2.74, 3.76]
    amps = [1.0, 0.5, 0.3, 0.2]
    x = np.zeros_like(t)
    for p, a in zip(partials, amps):
        x += a * _sine(base_f * p, t)
    x *= _envelope_ad(t, attack=0.005, decay=duration * 0.9, sr=sr)
    return x


# ----------------------------
# Sound designs (Witcher vibe)
# ----------------------------
def sfx_gale(duration: float) -> np.ndarray:
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    # Wind: filtered noise + slight pitch movement + whoosh swell
    base = _noise(n)
    base = _apply_lowpass(base, cutoff_hz=1200, sr=SAMPLE_RATE)
    whoosh = 0.6 * _sine(0.7, t) + 0.4 * _sine(1.3, t)
    x = base * (0.4 + 0.6 * (whoosh * 0.5 + 0.5))
    x = _apply_highpass(x, 80, SAMPLE_RATE)
    x = _normalize_peak(x, 0.8)
    x = _fade(x, SAMPLE_RATE, 0.03, 0.12)
    # Subtle stereo spread
    L = x * 1.0
    R = _apply_lowpass(x, 900, SAMPLE_RATE)
    return np.stack([L, R], axis=1)


def sfx_ember(duration: float) -> np.ndarray:
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    # Fire: low rumble + crackles (random spikes) + airy fizz
    rumble = 0.3 * _sine(65, t) + 0.2 * _sine(130, t)
    fizz = _apply_highpass(_noise(n) * 0.4, 3000, SAMPLE_RATE)
    crackles = np.zeros(n)
    for _ in range(18):
        pos = random.randint(0, n - int(0.015 * SAMPLE_RATE) - 1)
        length = int(0.015 * SAMPLE_RATE)
        spike = np.hanning(length) * (0.9 + 0.3 * random.random())
        crackles[pos : pos + length] += spike
    x = rumble + 0.5 * crackles + 0.25 * fizz
    x = _normalize_peak(x, 0.95)
    x = _fade(x, SAMPLE_RATE, 0.005, 0.1)
    stereo = np.stack([x, _apply_lowpass(x, 2500, SAMPLE_RATE)], axis=1)
    return _reverb_simple(stereo, SAMPLE_RATE, decay=0.55, num_taps=3, base_delay_ms=45)


def sfx_ward(duration: float) -> np.ndarray:
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    # Metallic shield pulse: bell-like hit + comb filter resonance
    hit = _bell_tone(duration, base_f=520.0)
    metal = _comb_filter(hit, delay_ms=14.5, feedback=0.4, sr=SAMPLE_RATE)
    x = 0.6 * hit + 0.7 * metal
    x = _normalize_peak(x, 0.9)
    x = _fade(x, SAMPLE_RATE, 0.002, 0.2)
    stereo = np.stack([x, x], axis=1)
    return _reverb_simple(stereo, SAMPLE_RATE, decay=0.6, num_taps=4, base_delay_ms=30)


def sfx_snare(duration: float) -> np.ndarray:
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    # Trap snap: short metallic clank + springy tail
    clank = np.zeros(n)
    burst_len = int(0.04 * SAMPLE_RATE)
    clank[:burst_len] = np.hanning(burst_len) * 1.0
    clank = _apply_highpass(clank, 1200, SAMPLE_RATE)
    tail = _comb_filter(clank * 0.6, delay_ms=11, feedback=0.5, sr=SAMPLE_RATE)
    x = clank * 0.8 + tail * 0.6
    x = _normalize_peak(x, 0.95)
    x = _fade(x, SAMPLE_RATE, 0.0, 0.25)
    stereo = np.stack([x, _apply_lowpass(x, 3500, SAMPLE_RATE)], axis=1)
    return _reverb_simple(stereo, SAMPLE_RATE, decay=0.45, num_taps=3, base_delay_ms=25)


def sfx_soothe(duration: float) -> np.ndarray:
    # Healing chime: soft bell + airy shimmer
    bell = _bell_tone(duration, base_f=740.0)
    shimmer = _apply_highpass(_noise(len(bell)) * 0.2, 6000, SAMPLE_RATE)
    x = 0.85 * bell + 0.2 * shimmer
    x = _normalize_peak(x, 0.9)
    x = _fade(x, SAMPLE_RATE, 0.01, 0.35)
    stereo = np.stack([x, x * 0.95], axis=1)
    return _reverb_simple(stereo, SAMPLE_RATE, decay=0.65, num_taps=4, base_delay_ms=55)


def sfx_void(duration: float) -> np.ndarray:
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    # Void: sub + reverse-like swell + airy dark texture
    sub = 0.7 * _sine(40, t) + 0.4 * _sine(80, t)
    texture = _apply_lowpass(_noise(n) * 0.3, 1200, SAMPLE_RATE)
    swell = np.clip(np.linspace(0.0, 1.0, n) ** 2.2, 0, 1)
    x = sub * (0.6 + 0.4 * swell) + 0.3 * texture * (1.0 - swell * 0.5)
    x = _normalize_peak(x, 0.9)
    x = _fade(x, SAMPLE_RATE, 0.03, 0.2)
    stereo = np.stack([x * 0.95, x], axis=1)
    return _reverb_simple(stereo, SAMPLE_RATE, decay=0.55, num_taps=4, base_delay_ms=70)


def sfx_aegis(duration: float) -> np.ndarray:
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    # Aegis: bright protective flare (riser + bell + sparkle)
    riser = _sine(320, t) * np.linspace(0.2, 1.0, n)
    bell = _bell_tone(duration, base_f=880.0)
    sparkle = _apply_highpass(_noise(n) * 0.2, 7000, SAMPLE_RATE)
    x = 0.6 * riser + 0.7 * bell + 0.18 * sparkle
    x = _normalize_peak(x, 0.92)
    x = _fade(x, SAMPLE_RATE, 0.005, 0.35)
    stereo = np.stack([x, x], axis=1)
    return _reverb_simple(stereo, SAMPLE_RATE, decay=0.6, num_taps=5, base_delay_ms=35)


# Map glyph -> generator
GENERATORS: dict[str, Callable[[float], np.ndarray]] = {
    "gale": sfx_gale,
    "ember": sfx_ember,
    "ward": sfx_ward,
    "snare": sfx_snare,
    "soothe": sfx_soothe,
    "void": sfx_void,
    "aegis": sfx_aegis,
}


# ----------------------------
# Main build
# ----------------------------
def main():
    _ensure_dirs()

    generated_files = []

    for name, gen in GENERATORS.items():
        dur = DURATION_S.get(name, 0.9)
        stereo = gen(dur)  # float32 stereo -1..1

        # Hard limiter + small gain normalization via pydub
        seg = _np_to_audiosegment(stereo, SAMPLE_RATE)
        seg = effects.normalize(seg)  # musical normalization

        out_path_mp3 = os.path.join(TARGET_DIR, f"{name}.mp3")
        _export_audio(seg, out_path_mp3, fallback_wav=True)

        if os.path.exists(out_path_mp3):
            generated_files.append(out_path_mp3)
        else:
            wav_fallback = os.path.splitext(out_path_mp3)[0] + ".wav"
            generated_files.append(wav_fallback)

    # Zip them
    zip_name = "sfx_witcher.zip"
    with zipfile.ZipFile(zip_name, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for f in generated_files:
            # Store inside zip preserving public/assets/sfx/ structure
            arcname = os.path.relpath(f, ".")
            zf.write(f, arcname)

    # Console summary
    print("\n✅ SFX generated:")
    for f in generated_files:
        print(" -", f)
    print(f"\n📦 Zip created: {zip_name}")

    # Final note about MP3 export
    if any(f.endswith(".wav") for f in generated_files):
        print(
            "\n⚠️ Note: Some files exported as WAV because ffmpeg wasn't detected.\n"
            "   Install ffmpeg and re-run to get MP3 (320 kbps)."
        )


if __name__ == "__main__":
    main()
