<script>
	import RestaurantMap from '#lib/components/RestaurantMap.svelte';
	import RestaurantSidebar from '#lib/components/RestaurantSidebar.svelte';

	let { data } = $props();
	let selectedRestaurantId = $state(/** @type {number | null} */ (null));
	let searchText = $state('');
	let searchError = $state('');
	let isSearching = $state(false);
	let searchCenter = $state(
		/** @type {{ latitude: number, longitude: number, label: string } | null} */ (null)
	);
	const selectedRestaurant = $derived(
		data.restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null
	);
	const nearbyRestaurants = $derived.by(() => {
		if (!searchCenter) return data.restaurants;

		const center = searchCenter;
		return data.restaurants.filter(
			(restaurant) =>
				restaurant.latitude !== null &&
				restaurant.longitude !== null &&
				distanceInKilometers(
					center.latitude,
					center.longitude,
					restaurant.latitude,
					restaurant.longitude
				) <= 1
		);
	});
	const sidebarData = $derived({ ...data, restaurants: nearbyRestaurants });
	const locationLabel = $derived(
		searchCenter?.label ??
			(data.restaurants[0]?.city ? `${data.restaurants[0].city} · 1km radius` : '1km radius')
	);

	/** @param {number} id */
	function selectRestaurant(id) {
		selectedRestaurantId = id;
	}

	/**
	 * @param {number} latitude1
	 * @param {number} longitude1
	 * @param {number} latitude2
	 * @param {number} longitude2
	 */
	function distanceInKilometers(latitude1, longitude1, latitude2, longitude2) {
		/** @param {number} degrees */
		const toRadians = (degrees) => (degrees * Math.PI) / 180;
		const latitudeDistance = toRadians(latitude2 - latitude1);
		const longitudeDistance = toRadians(longitude2 - longitude1);
		const distance =
			Math.sin(latitudeDistance / 2) ** 2 +
			Math.cos(toRadians(latitude1)) *
				Math.cos(toRadians(latitude2)) *
				Math.sin(longitudeDistance / 2) ** 2;

		return 6371 * 2 * Math.atan2(Math.sqrt(distance), Math.sqrt(1 - distance));
	}

	/** @param {SubmitEvent} event */
	async function searchLocation(event) {
		event.preventDefault();

		const query = searchText.trim();
		if (!query) return;

		searchError = '';
		isSearching = true;

		try {
			const restaurant = data.restaurants.find((place) =>
				place.name.toLowerCase().includes(query.toLowerCase())
			);

			if (restaurant && restaurant.latitude !== null && restaurant.longitude !== null) {
				searchCenter = {
					latitude: restaurant.latitude,
					longitude: restaurant.longitude,
					label: restaurant.name
				};
				return;
			}

			const url = new URL('https://nominatim.openstreetmap.org/search');
			url.searchParams.set('format', 'jsonv2');
			url.searchParams.set('limit', '1');
			url.searchParams.set('q', query);

			const response = await fetch(url);
			if (!response.ok) {
				throw new Error('Location search is temporarily unavailable.');
			}

			const results = await response.json();
			if (results.length === 0) {
				searchError = 'No location found. Try another address or restaurant.';
				return;
			}

			const latitude = Number(results[0].lat);
			const longitude = Number(results[0].lon);
			if (
				!Number.isFinite(latitude) ||
				!Number.isFinite(longitude) ||
				latitude < -90 ||
				latitude > 90 ||
				longitude < -180 ||
				longitude > 180
			) {
				throw new Error('The location search returned invalid coordinates.');
			}

			searchCenter = {
				latitude,
				longitude,
				label: String(results[0].display_name).split(',').slice(0, 2).join(',')
			};
		} catch (error) {
			console.error('Failed to search for location', error);
			searchError =
				error instanceof Error ? error.message : 'Location search failed. Please try again.';
		} finally {
			isSearching = false;
		}
	}

	function clearSearch() {
		searchText = '';
		searchError = '';
		searchCenter = null;
	}
</script>

<svelte:head>
	<title>Tastemap</title>
</svelte:head>

<main>
	<RestaurantSidebar
		data={sidebarData}
		{selectedRestaurant}
		{locationLabel}
		onRestaurantSelect={selectRestaurant}
		onBack={() => (selectedRestaurantId = null)}
	/>
	<section class="map-area">
		<RestaurantMap
			restaurants={nearbyRestaurants}
			{searchCenter}
			onRestaurantSelect={selectRestaurant}
		/>
		<form class="map-search" onsubmit={searchLocation}>
			<span aria-hidden="true">⌕</span>
			<input
				bind:value={searchText}
				type="search"
				placeholder="Search an area or restaurant"
				aria-label="Search a location or restaurant"
				aria-describedby={searchError ? 'search-radius search-error' : 'search-radius'}
			/>
			<span id="search-radius" class="radius">1 km<br />radius</span>
			<button type="submit" aria-label="Search" disabled={isSearching}>
				{isSearching ? '…' : '⌕'}
			</button>
			{#if searchCenter}
				<button type="button" class="clear-search" aria-label="Clear search" onclick={clearSearch}>
					×
				</button>
			{/if}
		</form>
		{#if searchError}
			<p id="search-error" class="search-error" role="status">{searchError}</p>
		{/if}
		<button class="owner-button">
			<span aria-hidden="true">▦</span>
			Owner of restaurant?
		</button>
	</section>
</main>

<style>
	:global(html),
	:global(body) {
		width: 100%;
		height: 100%;
		margin: 0;
		overflow: hidden;
	}

	main {
		display: flex;
		width: 100%;
		height: 100vh;
		height: 100dvh;
		background: #fbfaf6;
	}

	.map-area {
		position: relative;
		isolation: isolate;
		min-width: 0;
		flex: 1;
	}

	.map-search {
		position: absolute;
		z-index: 1;
		top: 20px;
		left: 50%;
		display: flex;
		width: min(340px, calc(100% - 40px));
		height: 38px;
		align-items: center;
		gap: 8px;
		padding: 0 10px;
		transform: translateX(-50%);
		border: 1px solid #e8e5dc;
		border-radius: 22px;
		background: #fbfaf6;
		box-shadow: 0 2px 9px #20281b1a;
		color: #77786f;
		font-family: Arial, sans-serif;
	}

	.map-search > span:first-child {
		font-size: 21px;
	}

	.map-search input {
		min-width: 0;
		flex: 1;
		border: 0;
		outline: 0;
		background: transparent;
		color: #292b25;
		font: inherit;
		font-size: 11px;
	}

	.radius {
		padding: 3px 6px;
		border-radius: 12px;
		background: #f0efe9;
		color: #62645d;
		font-size: 8px;
		line-height: 1.1;
		text-align: center;
	}

	.map-search button {
		border: 0;
		background: transparent;
		color: #74776f;
		font-size: 18px;
		cursor: pointer;
	}

	.map-search button:disabled {
		cursor: wait;
	}

	.map-search .clear-search {
		margin-left: -6px;
		color: #77786f;
	}

	.search-error {
		position: absolute;
		z-index: 1;
		top: 64px;
		left: 50%;
		width: min(340px, calc(100% - 40px));
		margin: 0;
		padding: 8px 12px;
		transform: translateX(-50%);
		border: 1px solid #e8e5dc;
		border-radius: 8px;
		background: #fbfaf6;
		box-shadow: 0 2px 9px #20281b1a;
		color: #8a3b32;
		font-family: Arial, sans-serif;
		font-size: 11px;
	}

	.owner-button {
		position: absolute;
		z-index: 1;
		top: 20px;
		right: 20px;
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 9px 13px;
		border: 0;
		border-radius: 20px;
		background: #376a4e;
		box-shadow: 0 2px 8px #20281b22;
		color: white;
		font-family: Arial, sans-serif;
		font-size: 11px;
		font-weight: 700;
	}

	@media (max-width: 700px) {
		.map-search {
			top: 12px;
		}

		.owner-button {
			top: auto;
			right: 12px;
			bottom: 12px;
		}
	}
</style>
