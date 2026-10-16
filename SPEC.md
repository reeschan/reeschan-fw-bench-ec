# EC catalog benchmark app spec (identical across frameworks)

Data source: `DATA_API_URL` (default http://localhost:4000), the mock API in data-api/.

Routes
- `/` list. Query `category`, `page`. One awaited fetch `GET /products?category&page&limit=24`. Renders header nav (8 categories), 24 cards, pager.
- `/products/:id` detail. Awaits `GET /products/:id` and `GET /products/:id/inventory` **in parallel**. Renders detail + `AddToCart` client component (qty +/-, add button, counter). Recommendations `GET /products/:id/recommendations` (slow, 300ms) are **streamed** behind a "Loading recommendations…" fallback.
- `/api/products/:id` JSON. Fetches product + inventory in parallel and returns `{ product, inventory }`.

Rules
- No framework-level caching of data (every request hits data-api). Cached variants are a later, separate run.
- Price formatting: `¥` + toLocaleString('ja-JP').
- Same styles.css, linked as a global stylesheet.
- Production build, run as a plain Node server, `PORT=3000`.
