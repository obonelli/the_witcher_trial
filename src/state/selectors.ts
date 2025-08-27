export function accuracy(correctTotal: number, playedTotal: number) {
    return playedTotal === 0 ? 0 : correctTotal / playedTotal;
}
