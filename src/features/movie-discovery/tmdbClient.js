const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const movieCache = new Map()

async function request(endpoint, params = {}, signal) {
  if (!API_KEY) throw new Error('TMDB API key is missing. Add VITE_TMDB_API_KEY to .env.local and restart Vite.')
  const query = new URLSearchParams({ api_key: API_KEY, ...params })
  const response = await fetch(`${API_BASE_URL}${endpoint}?${query}`, { signal })
  if (!response.ok) {
    if (response.status === 401) throw new Error('TMDB rejected the API key. Check VITE_TMDB_API_KEY.')
    throw new Error(`TMDB request failed (${response.status}). Please try again.`)
  }
  return response.json()
}

export function searchMovies(query, { page = 1, signal } = {}) {
  return request('/search/movie', { query, page: String(page), include_adult: 'false' }, signal)
}

export function discoverMovies({ genreIds = [], minRating = 0, page = 1, signal } = {}) {
  const params = { page: String(page), sort_by: 'popularity.desc', include_adult: 'false' }
  // TMDB uses a pipe for OR. A comma would require every genre on one movie.
  if (genreIds.length) params.with_genres = genreIds.join('|')
  if (minRating > 0) params['vote_average.gte'] = String(minRating)
  return request('/discover/movie', params, signal)
}

export function getMovieById(tmdbId) {
  const id = String(tmdbId)
  if (!movieCache.has(id)) {
    movieCache.set(id, request(`/movie/${encodeURIComponent(id)}`).catch((error) => {
      movieCache.delete(id)
      throw error
    }))
  }
  return movieCache.get(id)
}

export async function getMoviesByIds(ids, limit = 4) {
  const uniqueIds = [...new Set(ids.map(String))]
  const results = {}
  let nextIndex = 0
  async function worker() {
    while (nextIndex < uniqueIds.length) {
      const id = uniqueIds[nextIndex]
      nextIndex += 1
      try { results[id] = await getMovieById(id) } catch { /* keep other cards usable */ }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, uniqueIds.length) }, worker))
  return results
}

export function getPosterUrl(posterPath, size = 'w500') {
  return posterPath ? `https://image.tmdb.org/t/p/${size}${posterPath}` : null
}
