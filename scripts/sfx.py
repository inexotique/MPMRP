#!/usr/bin/env python3
"""Procedurally synthesised SFX + ambient music (100% original, no licence issues)."""
import numpy as np, wave, pathlib

SR = 48000
OUT = pathlib.Path(__file__).resolve().parent.parent / "public/sfx"
rng = np.random.default_rng(7)


def save(name, x, stereo=False):
    x = np.asarray(x, dtype=np.float64)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    if not stereo:
        x = np.stack([x, x], 1)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def t(d): return np.arange(int(SR * d)) / SR
def env(d, a, r): x = t(d); return np.minimum(x / a, 1) * np.exp(-np.maximum(x - a, 0) / r)


def lp(x, k):  # cheap one-pole lowpass with time-varying coeff
    y = np.zeros_like(x); k = np.broadcast_to(k, x.shape); acc = 0.0
    for i in range(len(x)): acc += k[i] * (x[i] - acc); y[i] = acc
    return y


def whoosh(d=0.6):
    n = rng.standard_normal(int(SR * d)); x = t(d)
    sweep = 0.02 + 0.25 * np.sin(np.pi * x / d) ** 2
    return lp(n, sweep) * np.sin(np.pi * x / d) ** 1.5


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # ambient tech bed: Am - F - C - G pads + soft pulse, 32 s loop
    for v, (tr, prog) in enumerate([(1.0, 0), (1.122, 1), (0.891, 2), (1.0595, 3)]):
        music(v, tr, prog)
    print("music ok")


PROGS = [
    [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]],
    [[220, 261.6, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [164.8, 207.7, 246.9]],
    [[174.6, 220, 261.6], [196, 246.9, 293.7], [220, 261.6, 329.6], [220, 261.6, 329.6]],
    [[220, 277.2, 329.6], [185, 220, 277.2], [246.9, 293.7, 370], [164.8, 207.7, 246.9]],
]


def music(v, tr, prog):
    bar = 4.0; chords = [[f * tr for f in c] for c in PROGS[prog]]
    L = np.zeros(int(SR * bar * 8)); R = np.zeros_like(L)
    for b in range(8):
        x = t(bar); seg = slice(int(b * bar * SR), int((b + 1) * bar * SR)); fade = np.minimum(1, np.minimum(x / 0.8, (bar - x) / 0.8))
        for i, fr in enumerate(chords[b % 4]):
            L[seg] += np.sin(2 * np.pi * fr * x * 1.002 + i) * fade * 0.25
            R[seg] += np.sin(2 * np.pi * fr * x * 0.998 + 2 * i) * fade * 0.25
        for k in range(8):  # eighth-note pulse on root, an octave up
            s = int((b * bar + k * 0.5) * SR); y = t(0.25)
            p = np.sin(2 * np.pi * chords[b % 4][0] * 2 * y) * np.exp(-y / 0.06) * 0.12
            L[s:s + len(y)] += p; R[s:s + len(y)] += p
        y = t(0.5)
        for k in range(4):  # sub kick on beats
            s = int((b * bar + k) * SR); kk = np.sin(2 * np.pi * np.cumsum(50 + 60 * np.exp(-y / 0.02)) / SR) * np.exp(-y / 0.12) * 0.35
            L[s:s + len(y)] += kk; R[s:s + len(y)] += kk
    save(f"music_{v}", np.stack([L, R], 1) * 0.8, stereo=True)


if __name__ == "__main__":
    main()
