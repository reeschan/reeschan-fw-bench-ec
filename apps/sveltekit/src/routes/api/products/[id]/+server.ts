import { json } from '@sveltejs/kit';
import { api } from '#lib/api';

export async function GET({ params }) {
	const [product, inventory] = await Promise.all([
		api(`/products/${params.id}`),
		api(`/products/${params.id}/inventory`)
	]);
	return json({ product, inventory });
}
