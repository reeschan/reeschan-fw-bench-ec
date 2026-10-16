<script lang="ts">
	import { yen } from '#lib/api';
	let { data } = $props();
	const href = (p: number) => `/?${data.category ? `category=${data.category}&` : ''}page=${p}`;
</script>

<svelte:head><title>Bench Store</title></svelte:head>
<h1>{data.category || 'All products'} ({data.total})</h1>
<div class="grid">
	{#each data.items as p (p.id)}
		<a class="card" href="/products/{p.id}">
			<div class="img"></div>
			<div>{p.name}</div>
			<div class="price">{yen(p.price)}</div>
			<div class="muted">★{p.rating} ({p.reviewCount})</div>
		</a>
	{/each}
</div>
<nav class="pager">
	{#if data.page > 1}<a href={href(data.page - 1)}>← Prev</a>{/if}
	<a href={href(data.page + 1)}>Next →</a>
</nav>
