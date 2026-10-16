import Link from 'next/link';
import type { ReactNode } from 'react';
import { CATEGORIES } from '../lib/api';
import './styles.css';

export const metadata = { title: 'Bench Store' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header>
          <Link className="logo" href="/">Bench Store</Link>
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/?category=${c}`}>{c}</Link>
          ))}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
