import Link from 'next/link';
import { Suspense } from 'react';
import { api, type Item } from '../lib/api';
import { yen } from '../lib/yen';

type SP = Promise<{ category?: string; page?: string }>;

// The layout is the prerendered static shell; the request-dependent list streams in.
export default function Home({ searchParams }: { searchParams: SP }) {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <List searchParams={searchParams} />
    </Suspense>
  );
}

async function List({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const category = sp.category ?? '';
  const page = Number(sp.page ?? 1);
  const qs = new URLSearchParams({ page: String(page), limit: '24' });
  if (category) qs.set('category', category);
  const data = await api<{ total: number; items: Item[] }>(`/products?${qs}`);
  const href = (p: number) => `/?${category ? `category=${category}&` : ''}page=${p}`;

  return (
    <>
      <h1>{category || 'All products'} ({data.total})</h1>
      <div className="grid">
        {data.items.map((p) => (
          <Link key={p.id} className="card" href={`/products/${p.id}`}>
            <div className="img" />
            <div>{p.name}</div>
            <div className="price">{yen(p.price)}</div>
            <div className="muted">★{p.rating} ({p.reviewCount})</div>
          </Link>
        ))}
      </div>
      <nav className="pager">
        {page > 1 && <Link href={href(page - 1)}>← Prev</Link>}
        <Link href={href(page + 1)}>Next →</Link>
      </nav>
    </>
  );
}
