import 'server-only';

export const CATEGORIES = ['shoes', 'bags', 'outerwear', 'tops', 'bottoms', 'accessories', 'kids', 'outdoor'];

export type Item = { id: number; name: string; category: string; price: number; rating: number; reviewCount: number };
export type Product = Item & { description: string; specs: Record<string, string | number> };

export async function api<T>(path: string): Promise<T> {
  const res = await fetch((process.env.DATA_API_URL ?? 'http://localhost:4000') + path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`data-api ${res.status} ${path}`);
  return res.json();
}
