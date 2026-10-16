const KEY = 'astrolab:favorites:v1';
export function readFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value.filter(x => x && typeof x.id === 'string') : [];
  } catch { return []; }
}
export function storeFavorites(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); return true; }
  catch { return false; }
}
