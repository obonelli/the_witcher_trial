'use client';
export default function HUD({ state }: { state: string }) {
    return (
        <div className="text-xs opacity-70">State: {state}</div>
    );
}
