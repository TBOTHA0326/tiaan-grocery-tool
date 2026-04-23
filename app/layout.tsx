import './globals.css';

export const metadata = {
  title: 'Tiaan Grocery + Expense Tracker',
  description: 'A simple local grocery and expense tracker built with Next.js and Tailwind CSS.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-950 antialiased">{children}</body>
    </html>
  );
}
