import { createServerFn } from '@tanstack/react-start';

export const CATEGORIES = ['shoes', 'bags', 'outerwear', 'tops', 'bottoms', 'accessories', 'kids', 'outdoor'];
export const yen = (n: number) => '¥' + n.toLocaleString('ja-JP');

export type Item = { id: number; name: string; category: string; price: number; rating: number; reviewCount: number };
export type Product = Item & { description: string; specs: Record<string, string | number> };

export async function api<T>(path: string): Promise<T> {
  const res = await fetch((process.env.DATA_API_URL ?? 'http://localhost:4000') + path);
  if (!res.ok) throw new Error(`data-api ${res.status} ${path}`);
  return res.json();
}

// Server functions: data-api is only ever called from the server, like the other two apps.
export const getList = createServerFn({ method: 'GET' })
  .validator((d: { category: string; page: number }) => d)
  .handler(({ data }) => {
    const qs = new URLSearchParams({ page: String(data.page), limit: '24' });
    if (data.category) qs.set('category', data.category);
    return api<{ total: number; items: Item[] }>(`/products?${qs}`);
  });

export const getProduct = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const [product, inventory] = await Promise.all([
      api<Product>(`/products/${id}`),
      api<{ stock: number }>(`/products/${id}/inventory`),
    ]);
    return { product, inventory };
  });

export const getRecommendations = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(({ data: id }) => api<{ items: Item[] }>(`/products/${id}/recommendations`));
