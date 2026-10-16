import { Await, Link, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { getProduct, getRecommendations, yen } from '../../lib';

export const Route = createFileRoute('/products/$id')({
  loader: async ({ params }) => {
    // Started first and not awaited: runs in parallel and is streamed after the shell.
    const recommendations = getRecommendations({ data: params.id });
    const { product, inventory } = await getProduct({ data: params.id });
    return { product, inventory, recommendations };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.product.name} | Bench Store` }] }),
  component: ProductPage,
});

function ProductPage() {
  const { product, inventory, recommendations } = Route.useLoaderData();
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
      <Await promise={recommendations} fallback={<p className="muted">Loading recommendations…</p>}>
        {(r) => (
          <div className="grid">
            {r.items.map((p) => (
              <Link key={p.id} className="card" to="/products/$id" params={{ id: String(p.id) }}>
                <div>{p.name}</div><div className="price">{yen(p.price)}</div>
              </Link>
            ))}
          </div>
        )}
      </Await>
    </>
  );
}

function AddToCart({ productId }: { productId: number }) {
  const [qty, setQty] = useState(1);
  const [inCart, setInCart] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '16px 0' }}>
      <button onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
      <span>{qty}</span>
      <button onClick={() => setQty(qty + 1)}>+</button>
      <button onClick={() => setInCart(inCart + qty)} data-product={productId}>Add to cart</button>
      <span className="muted">In cart: {inCart}</span>
    </div>
  );
}
