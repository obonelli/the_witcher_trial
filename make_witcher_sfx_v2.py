# make_witcher_sfx_v2.py
# Genera SFX estilo Witcher. Escribe WAVs con la stdlib (sin ffmpeg),
# luego convierte a MP3 320kbps con ffmpeg CLI (si está disponible).
# Salida: ./public/assets/sfx/*.mp3 (o .wav si no hay ffmpeg) y sfx_witcher.zip

import os
import io
import zipfile
import math
import random
import subprocess
import shutil
import wave
from typing import Callable

import numpy as np

# ----------------------------
# Config
# ----------------------------
SAMPLE_RATE = 44100
CHANNELS = 2  # stereo
TARGET_DIR = os.path.join(".", "public", "assets", "sfx")
TMP_WAV_DIR = os.path.join(".", ".tmp_wav_sfx")
BITRATE = "320k"
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
# Utils
# ----------------------------
def ensure_dirs():
    os.makedirs(TARGET_DIR, exist_ok=True)
    os.makedirs(TMP_WAV_DIR, exist_ok=True)


def has_ffmpeg() -> bool:
    exe = shutil.which("ffmpeg")
    return exe is not None


def normalize_peak(x: np.ndarray, peak: float = 0.95) -> np.ndarray:
    m = np.max(np.abs(x)) + 1e-12
    return (x / m) * peak


def fade(x: np.ndarray, sr: int, fi: float = 0.02, fo: float = 0.05) -> np.ndarray:
    n = x.shape[0]
    fi_n = int(sr * fi)
    fo_n = int(sr * fo)
    if fi_n > 0:
        env_in = np.linspace(0.0, 1.0, fi_n)
        x[:fi_n] *= env_in[:, None]
    if fo_n > 0:
        env_out = np.linspace(1.0, 0.0, fo_n)
        x[-fo_n:] *= env_out[:, None]
    return x


def lowpass(x: np.ndarray, cutoff_hz: float, sr: int) -> np.ndarray:
    rc = 1.0 / (2 * math.pi * cutoff_hz)
    dt = 1.0 / sr
    alpha = dt / (rc + dt)
    y = np.zeros_like(x)
    y[0] = x[0]
    for i in range(1, len(x)):
        y[i] = y[i - 1] + alpha * (x[i] - y[i - 1])
    return y


def highpass(x: np.ndarray, cutoff_hz: float, sr: int) -> np.ndarray:
    rc = 1.0 / (2 * math.pi * cutoff_hz)
    dt = 1.0 / sr
    alpha = rc / (rc + dt)
    y = np.zeros_like(x)
    y[0] = x[0]
    for i in range(1, len(x)):
        y[i] = alpha * (y[i - 1] + x[i] - x[i - 1])
    return y


def comb_filter(x: np.ndarray, delay_ms: float, feedback: float, sr: int) -> np.ndarray:
    d = int(sr * delay_ms / 1000.0)
    y = np.copy(x)
    for i in range(d, len(x)):
        y[i] += feedback * y[i - d]
    return normalize_peak(y, 0.9)


def reverb_simple(st: np.ndarray, sr: int, decay=0.5, taps=4, base_ms=60) -> np.ndarray:
    y = np.copy(st)
    for t in range(1, taps + 1):
        delay = int(sr * (base_ms * t) / 1000.0)
        gain = decay**t
        pad = np.zeros((delay, 2))
        tail = np.vstack([pad, st[:-delay]]) if delay < len(st) else pad
        y[:, 0] += gain * tail[:, 0]
        y[:, 1] += gain * tail[:, 1] * (0.9 + 0.2 * random.random())
    return normalize_peak(y, 0.95)


def sine(f, t):
    return np.sin(2 * np.pi * f * t)


def noise(n):
    return np.random.uniform(-1.0, 1.0, size=n)


def bell_tone(duration, base_f=660.0, sr=SAMPLE_RATE):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    partials = [1.0, 2.01, 2.74, 3.76]
    amps = [1.0, 0.5, 0.3, 0.2]
    x = np.zeros_like(t)
    for p, a in zip(partials, amps):
        x += a * sine(base_f * p, t)
    # Envelope
    a = int(0.005 * sr)
    d = int(duration * 0.9 * sr)
    env = np.ones_like(t)
    env[:a] = np.linspace(0, 1, a)
    env[a : a + d] = np.linspace(1, 0.25, min(d, len(t) - a))
    return x * env


def to_stereo(x: np.ndarray) -> np.ndarray:
    if x.ndim == 1:
        return np.stack([x, x], axis=1)
    return x


def write_wav_int16(path: str, stereo: np.ndarray, sr: int):
    # stereo float32 [-1,1] -> int16 PCM WAV
    stereo = np.clip(stereo, -1.0, 1.0)
    int16 = (stereo * (2**15 - 1)).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sr)
        wf.writeframes(int16.tobytes())


def convert_wav_to_mp3(wav_path: str, mp3_path: str, bitrate="320k") -> bool:
    if not has_ffmpeg():
        return False
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        wav_path,
        "-codec:a",
        "libmp3lame",
        "-b:a",
        bitrate,
        mp3_path,
    ]
    try:
        subprocess.check_call(cmd)
        return os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 1000
    except subprocess.CalledProcessError:
        return False


# ----------------------------
# SFX designs (Witcher vibe)
# ----------------------------
def sfx_gale(d: float) -> np.ndarray:
    n = int(SAMPLE_RATE * d)
    t = np.linspace(0, d, n, endpoint=False)
    base = noise(n)
    base = lowpass(base, 1200, SAMPLE_RATE)
    whoosh = 0.6 * sine(0.7, t) + 0.4 * sine(1.3, t)
    x = base * (0.4 + 0.6 * (whoosh * 0.5 + 0.5))
    x = highpass(x, 80, SAMPLE_RATE)
    x = normalize_peak(x, 0.8)
    L = x
    R = lowpass(x, 900, SAMPLE_RATE)
    st = np.stack([L, R], axis=1)
    return fade(st, SAMPLE_RATE, 0.03, 0.12)


def sfx_ember(d: float) -> np.ndarray:
    n = int(SAMPLE_RATE * d)
    t = np.linspace(0, d, n, endpoint=False)
    rumble = 0.3 * sine(65, t) + 0.2 * sine(130, t)
    fizz = highpass(noise(n) * 0.4, 3000, SAMPLE_RATE)
    crackles = np.zeros(n)
    for _ in range(18):
        pos = random.randint(0, n - int(0.015 * SAMPLE_RATE) - 1)
        L = int(0.015 * SAMPLE_RATE)
        spike = np.hanning(L) * (0.9 + 0.3 * random.random())
        crackles[pos : pos + L] += spike
    x = rumble + 0.5 * crackles + 0.25 * fizz
    x = normalize_peak(x, 0.95)
    st = np.stack([x, lowpass(x, 2500, SAMPLE_RATE)], axis=1)
    st = reverb_simple(st, SAMPLE_RATE, decay=0.55, taps=3, base_ms=45)
    return fade(st, SAMPLE_RATE, 0.005, 0.1)


def sfx_ward(d: float) -> np.ndarray:
    hit = bell_tone(d, base_f=520.0)
    metal = comb_filter(hit, delay_ms=14.5, feedback=0.4, sr=SAMPLE_RATE)
    x = 0.6 * hit + 0.7 * metal
    x = normalize_peak(x, 0.9)
    st = np.stack([x, x], axis=1)
    st = reverb_simple(st, SAMPLE_RATE, decay=0.6, taps=4, base_ms=30)
    return fade(st, SAMPLE_RATE, 0.002, 0.2)


def sfx_snare(d: float) -> np.ndarray:
    n = int(SAMPLE_RATE * d)
    clank = np.zeros(n)
    L = int(0.04 * SAMPLE_RATE)
    clank[:L] = np.hanning(L) * 1.0
    clank = highpass(clank, 1200, SAMPLE_RATE)
    tail = comb_filter(clank * 0.6, delay_ms=11, feedback=0.5, sr=SAMPLE_RATE)
    x = normalize_peak(clank * 0.8 + tail * 0.6, 0.95)
    st = np.stack([x, lowpass(x, 3500, SAMPLE_RATE)], axis=1)
    st = reverb_simple(st, SAMPLE_RATE, decay=0.45, taps=3, base_ms=25)
    return fade(st, SAMPLE_RATE, 0.0, 0.25)


def sfx_soothe(d: float) -> np.ndarray:
    bell = bell_tone(d, base_f=740.0)
    shimmer = highpass(noise(len(bell)) * 0.2, 6000, SAMPLE_RATE)
    x = normalize_peak(0.85 * bell + 0.2 * shimmer, 0.9)
    st = np.stack([x, x * 0.95], axis=1)
    st = reverb_simple(st, SAMPLE_RATE, decay=0.65, taps=4, base_ms=55)
    return fade(st, SAMPLE_RATE, 0.01, 0.35)


def sfx_void(d: float) -> np.ndarray:
    n = int(SAMPLE_RATE * d)
    t = np.linspace(0, d, n, endpoint=False)
    sub = 0.7 * sine(40, t) + 0.4 * sine(80, t)
    texture = lowpass(noise(n) * 0.3, 1200, SAMPLE_RATE)
    swell = np.clip(np.linspace(0.0, 1.0, n) ** 2.2, 0, 1)
    x = sub * (0.6 + 0.4 * swell) + 0.3 * texture * (1.0 - swell * 0.5)
    x = normalize_peak(x, 0.9)
    st = np.stack([x * 0.95, x], axis=1)
    st = reverb_simple(st, SAMPLE_RATE, decay=0.55, taps=4, base_ms=70)
    return fade(st, SAMPLE_RATE, 0.03, 0.2)


def sfx_aegis(d: float) -> np.ndarray:
    n = int(SAMPLE_RATE * d)
    t = np.linspace(0, d, n, endpoint=False)
    riser = sine(320, t) * np.linspace(0.2, 1.0, n)
    bell = bell_tone(d, base_f=880.0)
    sparkle = highpass(noise(n) * 0.2, 7000, SAMPLE_RATE)
    x = normalize_peak(0.6 * riser + 0.7 * bell + 0.18 * sparkle, 0.92)
    st = np.stack([x, x], axis=1)
    st = reverb_simple(st, SAMPLE_RATE, decay=0.6, taps=5, base_ms=35)
    return fade(st, SAMPLE_RATE, 0.005, 0.35)


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
# Build
# ----------------------------
def main():
    ensure_dirs()
    mp3_or_wav_paths = []

    for name, gen in GENERATORS.items():
        dur = DURATION_S.get(name, 0.9)
        stereo = gen(dur)  # float32 stereo [-1,1]
        # Sanity: ensure shape [N,2]
        if stereo.ndim == 1:
            stereo = to_stereo(stereo)
        # Write WAV first (no ffmpeg)
        wav_path = os.path.join(TMP_WAV_DIR, f"{name}.wav")
        write_wav_int16(wav_path, stereo, SAMPLE_RATE)

        # Try MP3 convert
        target_mp3 = os.path.join(TARGET_DIR, f"{name}.mp3")
        ok_mp3 = convert_wav_to_mp3(wav_path, target_mp3, BITRATE)

        if ok_mp3:
            mp3_or_wav_paths.append(target_mp3)
        else:
            # fallback: copy wav to target
            target_wav = os.path.join(TARGET_DIR, f"{name}.wav")
            shutil.copyfile(wav_path, target_wav)
            mp3_or_wav_paths.append(target_wav)

    # Zip preserving paths
    zip_name = "sfx_witcher.zip"
    with zipfile.ZipFile(zip_name, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p in mp3_or_wav_paths:
            zf.write(p, os.path.relpath(p, "."))

    # Clean tmp
    try:
        shutil.rmtree(TMP_WAV_DIR, ignore_errors=True)
    except Exception:
        pass

    # Summary
    print("\n✅ Archivos generados:")
    for p in mp3_or_wav_paths:
        print(" -", p)
    print(f"\n📦 Zip creado: {zip_name}")
    if not has_ffmpeg():
        print(
            "\n⚠️ Nota: No se detectó ffmpeg; exporté WAV. Instala ffmpeg y vuelve a correr para MP3 320kbps."
        )


if __name__ == "__main__":
    main()
