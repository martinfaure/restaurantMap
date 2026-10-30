<script>
	/** @type {{ data: import('../../routes/$types').PageData, selectedRestaurant: import('../../routes/$types').PageData['restaurants'][number] | null, locationLabel: string, onRestaurantSelect: (id: number) => void, onBack: () => void }} */
	let { data, selectedRestaurant, locationLabel, onRestaurantSelect, onBack } = $props();
	let activeTab = $state('ranked');
	let activeCuisine = $state('All');

	const tabs = [
		{ label: 'Ranked', value: 'ranked' },
		{ label: 'Want to try', value: 'want_to_try' }
	];
	const cuisineOrder = ['Basque', 'British', 'Punjabi', 'Italian', 'Taiwanese'];
	const categories = $derived([
		'All',
		...data.cuisines.toSorted((a, b) => {
			const aIndex = cuisineOrder.indexOf(a);
			const bIndex = cuisineOrder.indexOf(b);
			return (
				(aIndex === -1 ? cuisineOrder.length : aIndex) -
					(bIndex === -1 ? cuisineOrder.length : bIndex) || a.localeCompare(b)
			);
		})
	]);
	const visibleRestaurants = $derived(
		data.restaurants.filter(
			(restaurant) =>
				restaurant.list_status === activeTab &&
				(activeCuisine === 'All' || restaurant.cuisines.includes(activeCuisine))
		)
	);
	const rankedCount = $derived(
		data.restaurants.filter((restaurant) => restaurant.rank !== null).length
	);
	const wantToTryCount = $derived(
		data.restaurants.filter((restaurant) => restaurant.list_status === 'want_to_try').length
	);
	const activeTabCount = $derived(activeTab === 'ranked' ? rankedCount : wantToTryCount);
</script>

<aside class="sidebar">
	{#if selectedRestaurant}
		<header class="detail-header">
			<button class="back-button" onclick={onBack}>
				<span aria-hidden="true">‹</span>
				Back to all places
			</button>
		</header>

		<section class="detail-content" aria-labelledby="restaurant-title">
			<div class="photo-gallery">
				{#each selectedRestaurant.photos.slice(0, 3) as photo, index (photo.url)}
					<div class:hero-photo={index === 0} class="detail-photo">
						<img
							src={photo.url}
							alt={photo.alt_text ?? photo.caption ?? selectedRestaurant.name}
							onerror={(event) => event.currentTarget.parentElement?.remove()}
						/>
						{#if photo.caption}
							<span>{photo.caption}</span>
						{/if}
					</div>
				{/each}
			</div>

			<h1 id="restaurant-title">{selectedRestaurant.name}</h1>

			<div class="detail-summary">
				<div class="detail-tags">
					{#each selectedRestaurant.tags as tag (tag)}
						<span>{tag}</span>
					{/each}
				</div>
				<span
					class="detail-price"
					aria-label={`Price tier ${selectedRestaurant.price_tier} out of 4`}
				>
					{#each [1, 2, 3, 4] as level (level)}
						<span class:muted={level > selectedRestaurant.price_tier} aria-hidden="true">€</span>
					{/each}
				</span>
				{#if selectedRestaurant.rating_count > 0}
					<span class="detail-rating">
						<span aria-hidden="true">★</span>
						<strong>{selectedRestaurant.rating_avg.toFixed(1)}</strong>
						<small>({selectedRestaurant.rating_count} reviews)</small>
					</span>
				{/if}
			</div>

			{#if selectedRestaurant.description}
				<p class="detail-description">{selectedRestaurant.description}</p>
			{/if}

			<div class="detail-address">
				<span class="address-icon" aria-hidden="true">⌖</span>
				<div>
					<p>
						{selectedRestaurant.street_address}, {selectedRestaurant.city}
						{#if selectedRestaurant.postcode}
							{selectedRestaurant.postcode}
						{/if}
						· {selectedRestaurant.neighborhood}
					</p>
					<a
						href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${selectedRestaurant.street_address}, ${selectedRestaurant.city} ${selectedRestaurant.postcode ?? ''}`)}`}
						target="_blank"
						rel="noreferrer"
					>
						Get Directions ↗
					</a>
				</div>
			</div>
		</section>
	{:else}
		<header class="header">
			<a class="logo" href="/" aria-label="Tastemap, home">Tastemap.</a>
			<button class="close-button" aria-label="Close panel">x</button>
		</header>

		<div class="location-tag">
			<span aria-hidden="true"></span>
			{locationLabel} · {data.restaurants.length} places
		</div>

		<section class="intro">
			<h1>Your top tables</h1>
			<p>Ranked head-to-head, so your #3 really is better than your #4 — no five-star mush.</p>
		</section>

		<nav class="tabs" aria-label="Restaurant lists">
			{#each tabs as tab (tab.value)}
				<button
					class:active={activeTab === tab.value}
					aria-pressed={activeTab === tab.value}
					onclick={() => (activeTab = tab.value)}
				>
					{tab.label}
					<span class="tab-count">{tab.value === 'ranked' ? rankedCount : wantToTryCount}</span>
				</button>
			{/each}
		</nav>

		<div class="categories" aria-label="Cuisine filters">
			{#each categories as category (category)}
				<button
					class:active={activeCuisine === category}
					aria-pressed={activeCuisine === category}
					onclick={() => (activeCuisine = category)}
				>
					{category}
				</button>
			{/each}
		</div>

		<section class="restaurant-list" aria-label="Restaurant list">
			{#if visibleRestaurants.length > 0}
				{#each visibleRestaurants as restaurant (restaurant.id)}
					<button
						class="restaurant-row"
						type="button"
						onclick={() => onRestaurantSelect(restaurant.id)}
					>
						<span
							class="rank"
							aria-label={restaurant.rank ? `Rank ${restaurant.rank}` : 'Want to try'}
						>
							{restaurant.rank ?? '♡'}
						</span>
						<div class="restaurant-info">
							<h2>{restaurant.name}</h2>
							<p>{restaurant.tagline} · {restaurant.neighborhood}</p>
						</div>
						<div class="row-aside">
							<span class="price" aria-label={`Price tier ${restaurant.price_tier} out of 4`}>
								{#each [1, 2, 3, 4] as level (level)}
									<span class:muted={level > restaurant.price_tier} aria-hidden="true">€</span>
								{/each}
							</span>
						</div>
					</button>
				{/each}
			{:else}
				<p class="no-results">No restaurants match these filters.</p>
			{/if}
		</section>

		<footer>Tap any table to inspect notes, dishes &amp; coordinates.</footer>
	{/if}
</aside>

<style>
	.sidebar {
		position: relative;
		z-index: 2;
		display: flex;
		width: 314px;
		height: 100%;
		flex: 0 0 314px;
		flex-direction: column;
		border-right: 1px solid #e2e2dc;
		background: #fbfaf7;
		color: #242720;
		font-family: Arial, sans-serif;
	}

	.header {
		display: flex;
		height: 44px;
		flex: 0 0 44px;
		align-items: center;
		justify-content: space-between;
		padding: 0 18px;
	}

	.detail-header {
		display: flex;
		height: 43px;
		flex: 0 0 43px;
		align-items: center;
		padding: 0 16px;
		border-bottom: 1px solid #e9e7df;
	}

	.back-button {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 0;
		border: 0;
		background: transparent;
		color: #30332c;
		font: inherit;
		font-size: 11px;
		font-weight: 700;
		cursor: pointer;
	}

	.back-button span {
		font-size: 18px;
	}

	.detail-content {
		flex: 1;
		overflow-y: auto;
		padding: 18px;
	}

	.photo-gallery {
		display: grid;
		height: 258px;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1.35fr 1fr;
		gap: 4px;
		margin-bottom: 23px;
		overflow: hidden;
		border-radius: 2px;
	}

	.photo-gallery:empty {
		display: none;
	}

	.detail-photo {
		position: relative;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		background: #eeece4;
	}

	.detail-photo.hero-photo {
		grid-column: 1 / -1;
	}

	.detail-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.detail-photo > span {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		padding: 6px 8px;
		background: linear-gradient(transparent, #111b);
		color: white;
		font-size: 9px;
	}

	.detail-content h1 {
		margin: 0 0 10px;
		font-family: Georgia, serif;
		font-size: 23px;
		letter-spacing: -0.5px;
	}

	.detail-summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 7px;
	}

	.detail-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.detail-tags span {
		padding: 3px 6px;
		border: 1px solid #e5e5dd;
		border-radius: 8px;
		background: #f3f3ee;
		color: #55584f;
		font-size: 8px;
		font-weight: 700;
		text-transform: uppercase;
	}

	.detail-price {
		display: flex;
		color: #35372f;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.3px;
	}

	.detail-price .muted {
		color: #c8c9c2;
	}

	.detail-rating {
		display: flex;
		align-items: center;
		gap: 3px;
		color: #35372f;
		font-size: 11px;
	}

	.detail-rating > span {
		color: #b98531;
		font-size: 14px;
	}

	.detail-rating small {
		color: #96978f;
		font-size: 9px;
	}

	.detail-description {
		margin: 13px 0 20px;
		color: #696c63;
		font-size: 11px;
		line-height: 1.6;
	}

	.detail-address {
		display: flex;
		gap: 7px;
		margin-top: 18px;
		padding-top: 17px;
		border-top: 1px solid #e9e7df;
		color: #383b34;
	}

	.address-icon {
		color: #96978f;
		font-size: 17px;
	}

	.detail-address p {
		margin: 0 0 3px;
		font-size: 10px;
		line-height: 1.5;
	}

	.detail-address a {
		color: #376a4e;
		font-size: 9px;
		font-weight: 700;
		text-decoration: none;
	}

	.detail-address a:hover {
		text-decoration: underline;
	}

	.logo {
		color: #242720;
		font-family: Georgia, serif;
		font-size: 17px;
		font-weight: 700;
		text-decoration: none;
	}

	.close-button {
		border: 0;
		background: transparent;
		color: #9da098;
		font: inherit;
		font-size: 20px;
	}

	.location-tag {
		align-self: flex-start;
		max-width: calc(100% - 36px);
		overflow: hidden;
		margin: 3px 18px 12px;
		padding: 4px 9px;
		border: 1px solid #e8e8e1;
		border-radius: 20px;
		background: #f2f2ed;
		color: #53574e;
		font-size: 9px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.location-tag span {
		display: inline-block;
		width: 5px;
		height: 5px;
		margin-right: 5px;
		border-radius: 50%;
		background: #477458;
	}

	.intro {
		padding: 0 18px 2px;
	}

	h1 {
		margin: 0;
		font-family: Georgia, serif;
		font-size: 22px;
		letter-spacing: -0.7px;
	}

	.intro p {
		margin: 6px 0 8px;
		color: #77786f;
		font-size: 10px;
		line-height: 1.45;
	}

	.tabs {
		display: flex;
		gap: 17px;
		padding: 0 18px;
		border-bottom: 1px solid #e9e7df;
	}

	.tabs button {
		display: flex;
		align-items: baseline;
		gap: 4px;
		padding: 7px 0 6px;
		border: 0;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #77786f;
		font: inherit;
		font-size: 10px;
		cursor: pointer;
	}

	.tabs button.active {
		border-bottom-color: #376a4e;
		color: #282a24;
		font-weight: 700;
	}

	.tab-count {
		color: #9a9b91;
		font-size: 9px;
		font-weight: 400;
	}

	.categories {
		display: flex;
		gap: 5px;
		overflow-x: auto;
		padding: 8px 18px;
		border-bottom: 1px solid #eeece5;
		scrollbar-width: none;
	}

	.categories button {
		flex: 0 0 auto;
		padding: 3px 9px;
		border: 1px solid #e6e6df;
		border-radius: 18px;
		background: #f3f3ee;
		color: #53574e;
		font: inherit;
		font-size: 9px;
		cursor: pointer;
	}

	.categories button.active {
		border-color: #376a4e;
		background: #376a4e;
		color: white;
	}

	.restaurant-list {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 8px 9px;
		scrollbar-width: none;
	}

	.restaurant-row {
		width: 100%;
		display: grid;
		min-height: 54px;
		grid-template-columns: 22px minmax(0, 1fr) auto;
		align-items: center;
		gap: 8px;
		box-sizing: border-box;
		padding: 5px 7px;
		border: 1px solid transparent;
		border-radius: 28px;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.restaurant-row:hover {
		background: #f3f2ec;
	}

	.restaurant-row:focus-visible,
	.back-button:focus-visible {
		outline: 2px solid #376a4e;
		outline-offset: 2px;
	}

	.rank {
		color: #292b24;
		font-family: Georgia, serif;
		font-size: 16px;
		font-weight: 700;
		text-align: center;
	}

	.restaurant-info {
		min-width: 0;
	}

	.restaurant-info h2 {
		overflow: hidden;
		margin: 0 0 2px;
		color: #272a24;
		font-family: Arial, sans-serif;
		font-size: 11px;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.restaurant-info p {
		overflow: hidden;
		margin: 0;
		color: #77786f;
		font-size: 9px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row-aside {
		display: flex;
		min-width: 37px;
		align-self: stretch;
		flex-direction: column;
		align-items: flex-end;
		justify-content: center;
		gap: 3px;
	}

	.price {
		display: flex;
		color: #35372f;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.3px;
	}

	.price .muted {
		color: #c8c9c2;
	}

	.no-results {
		margin: 12px 6px;
		color: #77786f;
		font-size: 11px;
	}

	footer {
		padding: 10px 5px;
		border-top: 1px solid #e9e7df;
		color: #96978f;
		font-size: 9px;
		text-align: center;
	}

	@media (max-width: 700px) {
		.sidebar {
			position: absolute;
			top: 0;
			left: 0;
			width: min(314px, 85vw);
			height: 100%;
			flex-basis: min(314px, 85vw);
			box-shadow: 0 4px 20px #20281b1a;
		}
	}
</style>
