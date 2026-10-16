'use client';
import { useState } from 'react';

export default function AddToCart({ productId }: { productId: number }) {
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
