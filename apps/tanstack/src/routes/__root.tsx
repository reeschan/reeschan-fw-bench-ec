/// <reference types="vite/client" />
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { CATEGORIES } from '../lib';
import css from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'Bench Store' }],
    links: [{ rel: 'stylesheet', href: css }],
  }),
  component: () => (
    <RootDocument>
      <Outlet />
    </RootDocument>
  ),
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <Link className="logo" to="/">Bench Store</Link>
          {CATEGORIES.map((c) => (
            <Link key={c} to="/" search={{ category: c }}>{c}</Link>
          ))}
        </header>
        <main>{children}</main>
        <Scripts />
      </body>
    </html>
  );
}
