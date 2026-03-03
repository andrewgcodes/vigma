import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vigma — Design Editor',
  description: 'A sleek, minimalist design editor for creating frontends, components, images, and logos.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
