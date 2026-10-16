const API_URL = 'https://images-api.nasa.gov/search';

/** La API de imágenes de NASA devuelve una colección paginada en JSON. */
export async function searchNasaImages({ query, page = 1, signal } = {}) {
  const params = new URLSearchParams({ q: query || 'galaxy', media_type: 'image', page: String(page), page_size: '24' });
  let response;
  try { response = await fetch(`${API_URL}?${params}`, { signal, headers: { Accept: 'application/json' } }); }
  catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo establecer conexión con NASA. Revisá tu conexión a Internet.');
  }
  if (!response.ok) throw new Error(`NASA no respondió correctamente (HTTP ${response.status}).`);
  const json = await response.json();
  if (!json?.collection || !Array.isArray(json.collection.items)) throw new Error('La API devolvió un formato inesperado.');
  const items = json.collection.items.map(normalizeItem).filter(item => item.id && item.image);
  return { items, total: json.collection.metadata?.total_hits ?? 0 };
}

function normalizeItem(item) {
  const data = item.data?.[0] ?? {};
  const imageLink = item.links?.find(link => link.rel === 'preview' && link.render === 'image')?.href
    ?? item.links?.find(link => link.render === 'image')?.href ?? null;
  return {
    id: data.nasa_id ?? '',
    title: data.title ?? 'Sin título',
    description: data.description ?? 'La NASA no proporciona una descripción para este recurso.',
    date: data.date_created ?? '',
    center: data.center ?? 'NASA',
    keywords: data.keywords ?? [],
    image: imageLink,
    url: `https://images.nasa.gov/search-results?q=${encodeURIComponent(data.title ?? '')}`
  };
}
