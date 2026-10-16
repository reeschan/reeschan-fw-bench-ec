const BASE = process.env.DATA_API_URL ?? 'http://localhost:4000';

export async function api<T>(path: string): Promise<T> {
	const res = await fetch(BASE + path);
	if (!res.ok) throw new Error(`data-api ${res.status} ${path}`);
	return res.json();
}

export const CATEGORIES = ['shoes', 'bags', 'outerwear', 'tops', 'bottoms', 'accessories', 'kids', 'outdoor'];
export const yen = (n: number) => '¥' + n.toLocaleString('ja-JP');
