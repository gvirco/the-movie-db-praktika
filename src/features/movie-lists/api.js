const LISTS_URL = import.meta.env.VITE_TESTAPI_LISTS_URL
const SAVED_MOVIES_URL = import.meta.env.VITE_TESTAPI_SAVED_MOVIES_URL

function collectionUrl(url, id) {
  if (!url) {
    throw new Error('Configure the testapi.io collection URL in .env.local first.')
  }

  return id ? `${url.replace(/\/$/, '')}/${encodeURIComponent(id)}` : url
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Request failed (${response.status}).`)
  }

  if (response.status === 204) return null
  return response.json()
}

function records(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.records)) return data.records
  return data ? [data] : []
}

async function getRecord(url, id) {
  const data = await request(collectionUrl(url, id))
  const record = records(data)[0]
  if (!record) throw new Error('The selected item no longer exists.')
  return record
}

function withoutId(record) {
  const fields = { ...record }
  delete fields.id
  return fields
}

export async function getMovieLists(userId) {
  const data = await request(collectionUrl(LISTS_URL))
  return records(data).filter((list) => String(list.userId) === String(userId))
}

export async function createMovieList({ userId, name }) {
  const cleanName = name.trim()
  if (!userId) throw new Error('Enter a user ID before creating a list.')
  if (!cleanName) throw new Error('List name cannot be empty.')
  return request(collectionUrl(LISTS_URL), {
    method: 'POST',
    body: JSON.stringify({ userId: String(userId), name: cleanName }),
  })
}

export async function updateMovieList(id, changes) {
  const name = changes.name?.trim()
  if (changes.name !== undefined && !name) throw new Error('List name cannot be empty.')
  const current = await getRecord(LISTS_URL, id)
  return request(collectionUrl(LISTS_URL, id), {
    method: 'PUT',
    body: JSON.stringify({ ...withoutId(current), ...changes, ...(name ? { name } : {}), userId: String(current.userId) }),
  })
}

export async function deleteMovieList(id) {
  const movies = await getSavedMovies(id)
  if (movies.length) throw new Error('This list still has saved movies. Remove them before deleting the list.')
  return request(collectionUrl(LISTS_URL, id), { method: 'DELETE' })
}

export async function getSavedMovies(listId) {
  const data = await request(collectionUrl(SAVED_MOVIES_URL))
  return records(data).filter((movie) => String(movie.listId) === String(listId))
}

export async function createSavedMovie({ listId, tmdbId, status = 'Want to Watch', rating = '' }) {
  if (!listId) throw new Error('Choose a movie list first.')
  const cleanTmdbId = String(tmdbId).trim()
  if (!/^\d+$/.test(cleanTmdbId)) throw new Error('Enter a valid numeric TMDB ID.')

  const [lists, movies] = await Promise.all([
    request(collectionUrl(LISTS_URL)).then(records),
    getSavedMovies(listId),
  ])
  if (!lists.some((list) => String(list.id) === String(listId))) {
    throw new Error('The selected movie list no longer exists.')
  }
  if (movies.some((movie) => String(movie.tmdbId) === cleanTmdbId)) {
    throw new Error('That movie is already saved in this list.')
  }

  return request(collectionUrl(SAVED_MOVIES_URL), {
    method: 'POST',
    body: JSON.stringify({
      listId: String(listId),
      tmdbId: cleanTmdbId,
      status,
      ...(rating === '' ? {} : { rating: Number(rating) }),
    }),
  })
}

export async function updateSavedMovie(id, changes) {
  const next = { ...changes }
  if (next.rating === '') {
    delete next.rating
  } else if (next.rating !== undefined) {
    const rating = Number(next.rating)
    if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
      throw new Error('Rating must be a number from 1 to 10.')
    }
    next.rating = rating
  }
  const current = await getRecord(SAVED_MOVIES_URL, id)
  const currentFields = withoutId(current)
  delete currentFields.notes
  return request(collectionUrl(SAVED_MOVIES_URL, id), {
    method: 'PUT',
    body: JSON.stringify({ ...currentFields, ...next, listId: String(current.listId), tmdbId: String(current.tmdbId) }),
  })
}

export async function deleteSavedMovie(id) {
  return request(collectionUrl(SAVED_MOVIES_URL, id), { method: 'DELETE' })
}
