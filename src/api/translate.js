/** Traducción EN → ES mediante MyMemory (servicio público, sujeto a límites). */
const ENDPOINT = 'https://api.mymemory.translated.net/get';
const cache = new Map();
const STORAGE_KEY = 'astrolab:translations:v1';
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  for (const [key, value] of Object.entries(saved)) if (typeof value === 'string') cache.set(key, value);
} catch { /* La aplicación sigue funcionando si localStorage no está disponible. */ }

function persist() {
  try {
    const last = [...cache.entries()].slice(-180);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(last)));
  } catch { /* Espacio limitado o navegación privada. */ }
}

function splitText(text, maxLength = 420) {
  const parts = [];
  let remaining = text.trim();
  while (remaining.length > maxLength) {
    let cut = remaining.lastIndexOf(' ', maxLength);
    if (cut < maxLength / 2) cut = maxLength;
    parts.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

async function translateSegment(text, signal) {
  if (cache.has(text)) return cache.get(text);
  const url = `${ENDPOINT}?${new URLSearchParams({ q: text, langpair: 'en|es' })}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Servicio de traducción: HTTP ${response.status}`);
  const data = await response.json();
  if (Number(data.responseStatus) !== 200 || !data.responseData?.translatedText) throw new Error('Traducción no disponible');
  const translation = data.responseData.translatedText;
  if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|DAILY LIMIT/i.test(translation)) throw new Error('Límite de traducciones alcanzado');
  cache.set(text, translation);
  persist();
  return translation;
}

/** Si el servicio falla, conserva el contenido científico original de NASA. */
export async function translateToSpanish(text, { signal } = {}) {
  if (!text?.trim()) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cache.has(cleaned)) return cache.get(cleaned);
  const chunks = splitText(cleaned);
  const parts = [];
  for (const chunk of chunks) parts.push(await translateSegment(chunk, signal));
  const translation = parts.join(' ');
  cache.set(cleaned, translation);
  persist();
  return translation;
}
