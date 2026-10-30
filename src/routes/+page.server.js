import { DatabaseSync } from 'node:sqlite';

export function load() {
	const database = new DatabaseSync('db.sqlite', { readOnly: true });

	try {
		const tagRows = database
			.prepare(
				`SELECT restaurant_tags.restaurant_id, tags.name, tags.kind
				   FROM restaurant_tags
				   JOIN tags ON tags.id = restaurant_tags.tag_id
				   JOIN restaurants ON restaurants.id = restaurant_tags.restaurant_id
				  WHERE restaurants.listing_status = 'published'
				    AND restaurants.list_status IN ('ranked', 'want_to_try')
				  ORDER BY restaurant_tags.position`
			)
			.all();

		const rows = database
			.prepare(
				`SELECT id, name, tagline, description, street_address, postcode, phone,
				        neighborhood, city, price_tier, rating_avg, rating_count,
				        latitude, longitude, list_status, rank
				   FROM restaurants
				  WHERE listing_status = 'published'
				    AND list_status IN ('ranked', 'want_to_try')
				  ORDER BY CASE list_status WHEN 'ranked' THEN 0 ELSE 1 END, rank, id`
			)
			.all();

		const photoRows = database
			.prepare(
				`SELECT restaurant_id, url, caption, alt_text
				   FROM photos
				  ORDER BY restaurant_id, position`
			)
			.all();

		const restaurants = rows.map((row) => ({
			id: Number(row.id),
			name: String(row.name),
			tagline: row.tagline === null ? null : String(row.tagline),
			description: row.description === null ? null : String(row.description),
			street_address: String(row.street_address),
			postcode: row.postcode === null ? null : String(row.postcode),
			phone: row.phone === null ? null : String(row.phone),
			neighborhood: String(row.neighborhood),
			city: String(row.city),
			price_tier: Number(row.price_tier),
			rating_avg: Number(row.rating_avg),
			rating_count: Number(row.rating_count),
			latitude: row.latitude === null ? null : Number(row.latitude),
			longitude: row.longitude === null ? null : Number(row.longitude),
			list_status: row.list_status === 'ranked' ? 'ranked' : 'want_to_try',
			rank: row.rank === null ? null : Number(row.rank),
			tags: tagRows
				.filter((tag) => Number(tag.restaurant_id) === Number(row.id))
				.map((tag) => String(tag.name)),
			cuisines: tagRows
				.filter((tag) => Number(tag.restaurant_id) === Number(row.id) && tag.kind === 'cuisine')
				.map((tag) => String(tag.name)),
			photos: photoRows
				.filter((photo) => Number(photo.restaurant_id) === Number(row.id))
				.map((photo) => ({
					url: String(photo.url),
					caption: photo.caption === null ? null : String(photo.caption),
					alt_text: photo.alt_text === null ? null : String(photo.alt_text)
				}))
		}));

		const cuisines = database
			.prepare(
				`SELECT DISTINCT tags.name
				   FROM tags
				   JOIN restaurant_tags ON restaurant_tags.tag_id = tags.id
				   JOIN restaurants ON restaurants.id = restaurant_tags.restaurant_id
				  WHERE tags.kind = 'cuisine'
				    AND restaurants.listing_status = 'published'
				    AND restaurants.list_status IN ('ranked', 'want_to_try')
				  ORDER BY tags.name`
			)
			.all()
			.map((row) => String(row.name));

		return { restaurants, cuisines };
	} finally {
		database.close();
	}
}
