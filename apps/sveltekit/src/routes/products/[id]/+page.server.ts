import { api } from '#lib/api';

type Product = { id: number; name: string; category: string; price: number; rating: number; reviewCount: number; description: string; specs: Record<string, string | number> };
type Item = { id: number; name: string; price: number };

export async function load({ params }) {
	// Started first and not awaited: runs in parallel and is streamed after the shell.
	const recommendations = api<{ items: Item[] }>(`/products/${params.id}/recommendations`);
	const [product, inventory] = await Promise.all([
		api<Product>(`/products/${params.id}`),
		api<{ stock: number }>(`/products/${params.id}/inventory`)
	]);
	return { product, inventory, recommendations };
}
