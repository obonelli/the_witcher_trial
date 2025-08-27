// Root layout for the app.
// NOTE: keep all code comments in English.

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import '../styles/cursors.css'; // 👈 cursors (se carga después de globals.css)

// Load system fonts (optional, from Next.js starter)
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// SEO metadata
export const metadata: Metadata = {
  title: 'Witcher Signs Trainer',
  description:
    'Mini-game: memory + reflexes with original glyphs. Built with Next.js + TypeScript + Tailwind.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* Tailwind base theme for the whole app */}
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          'custom-cursor', // 👈 activa el pack de cursores
          'min-h-screen bg-[#0b0f14] text-white antialiased selection:bg-emerald-600/30',
        ].join(' ')}
        // 👇 Fallback visible para verificar que el PNG sirve como cursor.
        // Una vez que veas el cursor, puedes eliminar esta línea.
        style={{ cursor: "url('/assets/cursors/default.png') 8 4, auto" }}
      >
        {children}
      </body>
    </html>
  );
}
