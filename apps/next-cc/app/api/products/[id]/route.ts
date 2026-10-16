import { api } from '../../../../lib/api';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, inventory] = await Promise.all([api(`/products/${id}`), api(`/products/${id}/inventory`)]);
  return Response.json({ product, inventory });
}
