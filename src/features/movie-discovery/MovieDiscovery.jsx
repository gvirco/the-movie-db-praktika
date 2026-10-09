import { useEffect, useState } from 'react'
import { discoverMovies, getPosterUrl, searchMovies } from './tmdbClient'
import './movie-discovery.css'

const GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 18, name: 'Drama' }, { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
]

const MOODS = [
  { name: 'Happy', genres: [35, 10751, 16] },
  { name: 'Sad', genres: [18, 10749] },
  { name: 'Excited', genres: [28, 12, 878] },
  { name: 'Relaxed', genres: [10749, 99, 10402] },
]

function MovieCard({ movie, onSelectMovie }) {
  const year = movie.release_date?.slice(0, 4) || 'Year unknown'
  const posterUrl = getPosterUrl(movie.poster_path)

  function saveMovie() {
    onSelectMovie?.({
      tmdbId: movie.id,
      title: movie.title || movie.name,
      posterPath: movie.poster_path,
      rating: movie.vote_average,
    })
  }

  return (
    <article className="movie-card">
      {posterUrl ? <img className="movie-card__poster" src={posterUrl} alt={`${movie.title} poster`} loading="lazy" /> :
        <div className="movie-card__poster movie-card__poster--empty" aria-label="No poster available">No poster</div>}
      <div className="movie-card__body">
        <h3>{movie.title || movie.name}</h3>
        <p className="movie-card__meta">{year} <span aria-label="rating">★ {Number(movie.vote_average || 0).toFixed(1)}</span> · {movie.vote_count || 0} votes</p>
        <p className="movie-card__overview">{movie.overview || 'No description available.'}</p>
        <button type="button" onClick={saveMovie} disabled={!onSelectMovie}>Save to My Movies</button>
      </div>
    </article>
  )
}

export function MovieDiscovery({ onSelectMovie }) {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [minRating, setMinRating] = useState('0')
  const [mood, setMood] = useState('')
  const [movies, setMovies] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(async () => {
      setStatus('loading')
      setError('')
      try {
        const selectedMood = MOODS.find((item) => item.name === mood)
        const data = query.trim()
          ? await searchMovies(query.trim(), { page })
          : await discoverMovies({ genreIds: selectedMood?.genres || (genre ? [Number(genre)] : []), minRating: Number(minRating), page })
        if (!active) return
        let results = data.results || []
        // Search has no genre/rating parameters, so collect its pages before applying those filters.
        if (query.trim() && (genre || Number(minRating) > 0)) {
          const pages = Array.from({ length: Math.max(0, Math.min((data.total_pages || 1) - 1, 499)) }, (_, index) => index + 2)
          const additional = await Promise.all(pages.map((nextPage) => searchMovies(query.trim(), { page: nextPage })))
          results = [...results, ...additional.flatMap((result) => result.results || [])]
        }
        if (query.trim() && Number(minRating) > 0) results = results.filter((movie) => movie.vote_average >= Number(minRating))
        if (query.trim() && genre) results = results.filter((movie) => movie.genre_ids?.includes(Number(genre)))
        setMovies(results)
        setTotalPages(query.trim() && (genre || Number(minRating) > 0) ? 1 : (data.total_pages || 1))
        setStatus(results.length ? 'ready' : 'empty')
      } catch (requestError) {
        if (!active) return
        setError(requestError.message || 'Something went wrong.')
        setStatus('error')
      }
    }, query.trim() ? 350 : 0)
    return () => { active = false; window.clearTimeout(timer) }
  }, [query, genre, minRating, mood, page])

  function changeFilter(setter, value) {
    setter(value)
    setPage(1)
  }

  function changeMood(value) {
    setMood(value)
    setGenre('')
    setQuery('')
    setPage(1)
  }

  return (
    <main className="movie-discovery">
      <header className="discovery-heading">
        <p className="discovery-eyebrow">Find your next favorite</p>
        <h1>Movie Discovery</h1>
        <p>Search the TMDB library, shape the results, or pick a mood for a little inspiration.</p>
      </header>

      <section className="discovery-controls" aria-label="Movie search and filters">
        <label className="discovery-search">Search by title
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Try ‘The Grand Budapest Hotel’" />
        </label>
        <label>Genre
          <select value={genre} onChange={(event) => changeFilter(setGenre, event.target.value)}>
            <option value="">All genres</option>{GENRES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>Minimum rating
          <select value={minRating} onChange={(event) => changeFilter(setMinRating, event.target.value)}>
            {[0, 5, 6, 7, 8, 9].map((rating) => <option key={rating} value={rating}>{rating === 0 ? 'Any rating' : `${rating}+ / 10`}</option>)}
          </select>
        </label>
      </section>

      <section className="mood-picker" aria-labelledby="mood-heading">
        <div><h2 id="mood-heading">What’s your mood?</h2><p>Get recommendations matched to how you feel.</p></div>
        <div className="mood-picker__buttons">{MOODS.map((item) => <button key={item.name} type="button" className={mood === item.name ? 'is-selected' : ''} aria-pressed={mood === item.name} onClick={() => changeMood(mood === item.name ? '' : item.name)}>{item.name}</button>)}</div>
      </section>

      <section className="movie-results" aria-live="polite">
        <div className="movie-results__heading"><h2>{mood ? `${mood} picks` : query ? 'Search results' : 'Popular movies'}</h2>{status === 'ready' && <span>{movies.length} movies</span>}</div>
        {status === 'loading' && <p className="discovery-message">Finding movies…</p>}
        {status === 'error' && <p className="discovery-message discovery-message--error" role="alert">{error}</p>}
        {status === 'empty' && <p className="discovery-message">No movies matched those filters. Try a different title or loosen a filter.</p>}
        {status === 'ready' && <div className="movie-grid">{movies.map((movie) => <MovieCard key={movie.id} movie={movie} onSelectMovie={onSelectMovie} />)}</div>}
        {status === 'ready' && totalPages > 1 && <nav className="pagination" aria-label="Results pages"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></nav>}
      </section>

      <footer className="tmdb-attribution">
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <p>Movie information and images are provided by TMDB. Ratings reflect TMDB user votes and may change.</p>
        <p>Local prototype setup: add <code>VITE_TMDB_API_KEY=your_key</code> to <code>.env.local</code>. Vite client-side environment variables are publicly visible in the browser bundle. Production deployment requires a server-side proxy to protect the API key.</p>
      </footer>
    </main>
  )
}

export default MovieDiscovery
