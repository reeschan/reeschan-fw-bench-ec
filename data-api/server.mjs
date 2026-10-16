// Mock data API for the EC catalog benchmark.
// Deterministic data + configurable artificial latency, so every framework sees identical I/O.
import http from 'node:http';

const PORT = Number(process.env.PORT ?? 4000);
const DELAY = {
  list: Number(process.env.DELAY_LIST_MS ?? 50),
  product: Number(process.env.DELAY_PRODUCT_MS ?? 50),
  inventory: Number(process.env.DELAY_INVENTORY_MS ?? 30),
  recommendations: Number(process.env.DELAY_RECO_MS ?? 300),
};
const CATEGORIES = ['shoes', 'bags', 'outerwear', 'tops', 'bottoms', 'accessories', 'kids', 'outdoor'];
const N = 1000;

// Simple seeded PRNG so data is identical across runs.
let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

const products = Array.from({ length: N }, (_, i) => {
  const id = i + 1;
  const category = CATEGORIES[i % CATEGORIES.length];
  return {
    id,
    slug: `product-${id}`,
    name: `${category[0].toUpperCase()}${category.slice(1)} Item ${id}`,
    category,
    price: Math.round(1000 + rand() * 49000),
    rating: Math.round((3 + rand() * 2) * 10) / 10,
    reviewCount: Math.floor(rand() * 2000),
    image: `https://picsum.photos/seed/${id}/600/600`,
    description: Array.from({ length: 6 }, () =>
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.'
    ).join(' '),
    specs: { material: ['cotton', 'leather', 'nylon', 'wool'][i % 4], weightGrams: 100 + (i % 900), origin: 'JP' },
  };
});
const summary = ({ description, specs, ...rest }) => rest;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const json = (res, status, body) => {
  const s = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(s) });
  res.end(s);
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname.split('/').filter(Boolean);
    // Per-request override: ?delay=ms
    const override = url.searchParams.has('delay') ? Number(url.searchParams.get('delay')) : null;
    const wait = (d) => sleep(override ?? d);

    if (p[0] === 'health') return json(res, 200, { ok: true });
    if (p[0] !== 'products') return json(res, 404, { error: 'not found' });

    if (p.length === 1) {
      await wait(DELAY.list);
      const category = url.searchParams.get('category');
      const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
      const limit = Math.min(100, Number(url.searchParams.get('limit') ?? 24));
      const list = category ? products.filter((x) => x.category === category) : products;
      return json(res, 200, {
        total: list.length,
        page,
        items: list.slice((page - 1) * limit, page * limit).map(summary),
      });
    }

    const product = products[Number(p[1]) - 1];
    if (!product) return json(res, 404, { error: 'not found' });

    if (p.length === 2) {
      await wait(DELAY.product);
      return json(res, 200, product);
    }
    if (p[2] === 'inventory') {
      await wait(DELAY.inventory);
      return json(res, 200, { id: product.id, stock: Math.floor(Math.random() * 50), updatedAt: Date.now() });
    }
    if (p[2] === 'recommendations') {
      await wait(DELAY.recommendations);
      const recos = Array.from({ length: 8 }, (_, k) => products[(product.id + k * 37) % N]).map(summary);
      return json(res, 200, { items: recos });
    }
    json(res, 404, { error: 'not found' });
  })
  .listen(PORT, () => console.log(`data-api on :${PORT}`, DELAY));
