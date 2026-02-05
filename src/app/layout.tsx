import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PublicOS 2.0 — Spatial Operating System',
  description:
    'Real-time collaborative GIS with agentic AI, physics simulation, and WASM extensibility.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">
      <body className="bg-pos-primary text-pos-text antialiased">
        {children}
      </body>
    </html>
  );
}
