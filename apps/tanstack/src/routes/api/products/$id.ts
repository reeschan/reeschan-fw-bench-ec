import { createFileRoute } from '@tanstack/react-router';
import { api } from '../../../lib';

export const Route = createFileRoute('/api/products/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const [product, inventory] = await Promise.all([
          api(`/products/${params.id}`),
          api(`/products/${params.id}/inventory`),
        ]);
        return Response.json({ product, inventory });
      },
    },
  },
});
