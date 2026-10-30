<script>
	import { onMount } from 'svelte';
	import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
	import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
	import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
	import 'leaflet/dist/leaflet.css';

	/** @type {{ restaurants: import('../../routes/$types').PageData['restaurants'], searchCenter: { latitude: number, longitude: number, label: string } | null, onRestaurantSelect: (id: number) => void }} */
	let { restaurants, searchCenter, onRestaurantSelect } = $props();
	/** @type {HTMLDivElement} */
	let mapElement;
	/** @type {(restaurants: import('../../routes/$types').PageData['restaurants'], searchCenter: { latitude: number, longitude: number, label: string } | null) => void} */
	let updateMap = () => {};

	onMount(() => {
		let disposed = false;
		let removeMap = () => {};

		void import('leaflet')
			.then(({ default: L }) => {
				if (disposed || !mapElement) return;

				const map = L.map(mapElement, { zoomControl: false });

				removeMap = () => map.remove();

				L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				}).addTo(map);

				const defaultMarkerIcon = L.icon({
					iconRetinaUrl: markerIcon2xUrl,
					iconUrl: markerIconUrl,
					shadowUrl: markerShadowUrl
				});

				const markerLayer = L.layerGroup().addTo(map);
				/** @type {import('leaflet').Circle | null} */
				let radiusCircle = null;

				L.control.zoom({ position: 'bottomright' }).addTo(map);

				updateMap = (currentRestaurants, currentSearchCenter) => {
					markerLayer.clearLayers();
					const bounds = L.latLngBounds([]);

					for (const restaurant of currentRestaurants) {
						if (restaurant.latitude === null || restaurant.longitude === null) continue;

						const marker = L.marker([restaurant.latitude, restaurant.longitude], {
							icon: defaultMarkerIcon,
							title: restaurant.name,
							alt: restaurant.name
						}).addTo(markerLayer);

						marker.on('click', () => onRestaurantSelect(restaurant.id));
						bounds.extend([restaurant.latitude, restaurant.longitude]);
					}

					if (radiusCircle) {
						map.removeLayer(radiusCircle);
						radiusCircle = null;
					}

					if (currentSearchCenter) {
						const center = [currentSearchCenter.latitude, currentSearchCenter.longitude];
						radiusCircle = L.circle(center, {
							radius: 1000,
							color: '#376a4e',
							weight: 1,
							fillColor: '#376a4e',
							fillOpacity: 0.08
						}).addTo(map);
						map.fitBounds(radiusCircle.getBounds(), { padding: [24, 24] });
					} else if (bounds.isValid()) {
						map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
					} else {
						map.setView([51.5072, -0.1276], 12);
					}
				};

				updateMap(restaurants, searchCenter);
			})
			.catch((error) => {
				console.error('Failed to load Leaflet map', error);
			});

		return () => {
			disposed = true;
			removeMap();
		};
	});

	$effect(() => {
		updateMap(restaurants, searchCenter);
	});
</script>

<div
	bind:this={mapElement}
	id="restaurant-map"
	aria-label="Map of restaurants"
	role="application"
></div>

<style>
	#restaurant-map {
		position: absolute;
		z-index: 0;
		inset: 0;
		background: #ecebdc;
	}
</style>
