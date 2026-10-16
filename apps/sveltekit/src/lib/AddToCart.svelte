<script lang="ts">
	let { productId }: { productId: number } = $props();
	let qty = $state(1);
	let inCart = $state(0);
</script>

<div style="display:flex;gap:8px;align-items:center;margin:16px 0">
	<button onclick={() => (qty = Math.max(1, qty - 1))}>-</button>
	<span>{qty}</span>
	<button onclick={() => qty++}>+</button>
	<button onclick={() => (inCart += qty)} data-product={productId}>Add to cart</button>
	<span class="muted">In cart: {inCart}</span>
</div>
