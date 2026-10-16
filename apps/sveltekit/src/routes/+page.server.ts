import { api } from '#lib/api';

type Item = { id: number; name: string; category: string; price: number; rating: number; reviewCount: number };

export async function load({ url }) {
	const category = url.searchParams.get('category') ?? '';
	const page = Number(url.searchParams.get('page') ?? 1);
	const qs = new URLSearchParams({ page: String(page), limit: '24' });
	if (category) qs.set('category', category);
	const data = await api<{ total: number; items: Item[] }>(`/products?${qs}`);
	return { ...data, category, page };
}
