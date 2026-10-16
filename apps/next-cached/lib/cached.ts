import 'server-only';
import { cacheLife } from 'next/cache';
import { api, type Item, type Product } from './api';

// Catalog data is cached ('use cache'); inventory stays per-request (see callers).
export async function getList(qs: string) {
  'use cache';
  cacheLife('minutes');
  return api<{ total: number; items: Item[] }>(`/products?${qs}`);
}

export async function getProduct(id: string) {
  'use cache';
  cacheLife('minutes');
  return api<Product>(`/products/${id}`);
}

export async function getRecommendations(id: string) {
  'use cache';
  cacheLife('minutes');
  return api<{ items: Item[] }>(`/products/${id}/recommendations`);
}
