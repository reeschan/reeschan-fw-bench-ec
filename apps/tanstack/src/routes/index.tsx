import { Link, createFileRoute } from '@tanstack/react-router';
import { getList, yen } from '../lib';

export const Route = createFileRoute('/')({
  // Optional params so `/` is served as-is (no redirect to a canonical search string).
  validateSearch: (s: Record<string, unknown>): { category?: string; page?: number } => ({
    category: typeof s.category === 'string' ? s.category : undefined,
    page: s.page ? Number(s.page) : undefined,
  }),
  loaderDeps: ({ search }) => ({ category: search.category ?? '', page: search.page ?? 1 }),
  loader: ({ deps }) => getList({ data: deps }),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const { category = '', page = 1 } = Route.useSearch();
  return (
    <>
      <h1>{category || 'All products'} ({data.total})</h1>
      <div className="grid">
        {data.items.map((p) => (
          <Link key={p.id} className="card" to="/products/$id" params={{ id: String(p.id) }}>
            <div className="img" />
            <div>{p.name}</div>
            <div className="price">{yen(p.price)}</div>
            <div className="muted">★{p.rating} ({p.reviewCount})</div>
          </Link>
        ))}
      </div>
      <nav className="pager">
        {page > 1 && <Link to="/" search={{ category: category || undefined, page: page - 1 }}>← Prev</Link>}
        <Link to="/" search={{ category: category || undefined, page: page + 1 }}>Next →</Link>
      </nav>
    </>
  );
}
