const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
async function request(endpoint, params = {}) {
  if (!API_KEY) {
    throw new Error('TMDB API key is missing. Add VITE_TMDB_API_KEY to .env.local and restart Vite.')
  }

  const query = new URLSearchParams({ api_key: API_KEY, ...params })
  const response = await fetch(`${API_BASE_URL}${endpoint}?${query}`)

  if (!response.ok) {
    if (response.status === 401) throw new Error('TMDB rejected the API key. Check VITE_TMDB_API_KEY.')
    throw new Error(`TMDB request failed (${response.status}). Please try again.`)
  }

  return response.json()
}

export function searchMovies(query, { page = 1 } = {}) {
  return request('/search/movie', { query, page: String(page), include_adult: 'false' })
}

export function discoverMovies({ genreIds, minRating = 0, page = 1, sortBy = 'popularity.desc' } = {}) {
  const params = { page: String(page), sort_by: sortBy, include_adult: 'false' }
  if (genreIds?.length) params.with_genres = genreIds.join(',')
  if (minRating > 0) params['vote_average.gte'] = String(minRating)
  return request('/discover/movie', params)
}

export function getMovieById(tmdbId) {
  return request(`/movie/${encodeURIComponent(tmdbId)}`)
}

export function getPosterUrl(posterPath, size = 'w500') {
  return posterPath ? `https://image.tmdb.org/t/p/${size}${posterPath}` : null
}
