<script lang="ts">
	import { yen } from '#lib/api';
	import AddToCart from '#lib/AddToCart.svelte';
	let { data } = $props();
</script>

<svelte:head><title>{data.product.name} | Bench Store</title></svelte:head>
<div class="detail">
	<div class="card"><div class="img"></div></div>
	<div>
		<h1>{data.product.name}</h1>
		<div class="price">{yen(data.product.price)}</div>
		<div class="muted">★{data.product.rating} ({data.product.reviewCount} reviews)</div>
		<p>{data.inventory.stock > 0 ? `In stock: ${data.inventory.stock}` : 'Out of stock'}</p>
		<AddToCart productId={data.product.id} />
		<p>{data.product.description}</p>
		<ul>
			{#each Object.entries(data.product.specs) as [k, v]}<li>{k}: {v}</li>{/each}
		</ul>
	</div>
</div>
<h2>Recommended</h2>
{#await data.recommendations}
	<p class="muted">Loading recommendations…</p>
{:then r}
	<div class="grid">
		{#each r.items as p (p.id)}
			<a class="card" href="/products/{p.id}"><div>{p.name}</div><div class="price">{yen(p.price)}</div></a>
		{/each}
	</div>
{/await}
