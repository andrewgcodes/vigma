import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vigma - Design Tool',
  description: 'A browser-based design tool for creating frontends, components, images, and logos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
