import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Grocery List',
  description: 'Minimal grocery planner with mobile-first controls.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
