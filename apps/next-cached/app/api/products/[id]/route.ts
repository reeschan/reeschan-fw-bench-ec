import { api } from '../../../../lib/api';
import { getProduct } from '../../../../lib/cached';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, inventory] = await Promise.all([getProduct(id), api(`/products/${id}/inventory`)]);
  return Response.json({ product, inventory });
}
