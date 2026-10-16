import Link from 'next/link';
import { Suspense, cache } from 'react';
import { api, type Item, type Product } from '../../../lib/api';
import { yen } from '../../../lib/yen';
import AddToCart from './AddToCart';

type Props = { params: Promise<{ id: string }> };

// cache(): generateMetadata and the page share one product fetch per request.
const fetchProduct = cache((id: string) => api<Product>(`/products/${id}`));

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);
  return { title: `${product.name} | Bench Store` };
}

// The layout is the prerendered static shell; product, inventory and recommendations stream in.
export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Props) {
  const { id } = await params;
  // Started first and not awaited: runs in parallel and is streamed after the main content.
  const recommendations = api<{ items: Item[] }>(`/products/${id}/recommendations`);
  const [product, inventory] = await Promise.all([
    fetchProduct(id),
    api<{ stock: number }>(`/products/${id}/inventory`),
  ]);
  return (
    <>
      <div className="detail">
        <div className="card"><div className="img" /></div>
        <div>
          <h1>{product.name}</h1>
          <div className="price">{yen(product.price)}</div>
          <div className="muted">★{product.rating} ({product.reviewCount} reviews)</div>
          <p>{inventory.stock > 0 ? `In stock: ${inventory.stock}` : 'Out of stock'}</p>
          <AddToCart productId={product.id} />
          <p>{product.description}</p>
          <ul>
            {Object.entries(product.specs).map(([k, v]) => <li key={k}>{k}: {v}</li>)}
          </ul>
        </div>
      </div>
      <h2>Recommended</h2>
      <Suspense fallback={<p className="muted">Loading recommendations…</p>}>
        <Recommendations data={recommendations} />
      </Suspense>
    </>
  );
}

async function Recommendations({ data }: { data: Promise<{ items: Item[] }> }) {
  const r = await data;
  return (
    <div className="grid">
      {r.items.map((p) => (
        <Link key={p.id} className="card" href={`/products/${p.id}`}>
          <div>{p.name}</div><div className="price">{yen(p.price)}</div>
        </Link>
      ))}
    </div>
  );
}
