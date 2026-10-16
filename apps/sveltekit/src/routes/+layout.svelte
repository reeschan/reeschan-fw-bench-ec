<script lang="ts">
	import '#lib/styles.css';
	import { CATEGORIES } from '#lib/api';
	let { children } = $props();
</script>

<header>
	<a class="logo" href="/">Bench Store</a>
	{#each CATEGORIES as c}<a href="/?category={c}">{c}</a>{/each}
</header>
<main>{@render children()}</main>
