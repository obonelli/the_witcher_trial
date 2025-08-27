// Minimal haptics using the Vibration API (best-effort)
export function buzzOk() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(25); // short tick
    }
}
export function buzzBad() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([20, 30, 20]); // small pattern
    }
}
