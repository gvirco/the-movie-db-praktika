import { useEffect, useState } from 'react'
import { discoverMovies, getPosterUrl, searchMovies } from './tmdbClient'
import './movie-discovery.css'

const GENRES = [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' }, { id: 18, name: 'Drama' }, { id: 14, name: 'Fantasy' }, { id: 27, name: 'Horror' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' }, { id: 53, name: 'Thriller' }]
const MOODS = [{ name: 'Happy', genres: [35, 10751, 16] }, { name: 'Sad', genres: [18, 10749] }, { name: 'Excited', genres: [28, 12, 878] }, { name: 'Relaxed', genres: [10749, 99, 10402] }]

function MovieCard({ movie, onSelectMovie }) {
  const title = movie.title || movie.name || 'Untitled movie'
  const posterUrl = getPosterUrl(movie.poster_path)
  return <article className="movie-card">
    {posterUrl ? <img className="movie-card__poster" src={posterUrl} alt={`${title} poster`} loading="lazy" /> : <div className="movie-card__poster movie-card__poster--empty">No poster</div>}
    <div className="movie-card__body"><h3>{title}</h3><p className="movie-card__meta">{movie.release_date?.slice(0, 4) || 'Year unknown'} <span>★ {Number(movie.vote_average || 0).toFixed(1)}</span></p><p className="movie-card__overview">{movie.overview || 'No description available.'}</p><button type="button" onClick={() => onSelectMovie?.({ tmdbId: movie.id, title, posterPath: movie.poster_path })} disabled={!onSelectMovie}>Save to My Movies</button></div>
  </article>
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
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setStatus('loading'); setError('')
      try {
        const selectedMood = MOODS.find((item) => item.name === mood)
        const data = query.trim() ? await searchMovies(query.trim(), { page, signal: controller.signal }) : await discoverMovies({ genreIds: selectedMood?.genres || (genre ? [Number(genre)] : []), minRating: Number(minRating), page, signal: controller.signal })
        let results = data.results || []
        // TMDB title search cannot filter server-side, so only this page is filtered.
        if (query.trim() && genre) results = results.filter((movie) => movie.genre_ids?.includes(Number(genre)))
        if (query.trim() && Number(minRating) > 0) results = results.filter((movie) => movie.vote_average >= Number(minRating))
        setMovies(results); setTotalPages(Math.min(data.total_pages || 1, 500)); setStatus(results.length ? 'ready' : 'empty')
      } catch (requestError) {
        if (requestError.name !== 'AbortError') { setError(requestError.message || 'Something went wrong.'); setStatus('error') }
      }
    }, query.trim() ? 350 : 0)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [query, genre, minRating, mood, page])

  function resetPage(action) { action(); setPage(1) }
  const searchIsFiltered = Boolean(query.trim() && (genre || Number(minRating) > 0))
  return <main className="movie-discovery">
    <header className="discovery-heading"><p className="discovery-eyebrow">Find your next favorite</p><h1>Discover movies</h1><p>Search TMDB, refine results, or pick a mood for inspiration.</p></header>
    <section className="discovery-controls" aria-label="Movie search and filters"><label className="discovery-search">Search by title<input value={query} onChange={(event) => resetPage(() => { setQuery(event.target.value); setMood('') })} placeholder="Try “The Grand Budapest Hotel”" /></label><label>Genre<select value={genre} onChange={(event) => resetPage(() => { setGenre(event.target.value); setMood('') })}><option value="">All genres</option>{GENRES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Minimum rating<select value={minRating} onChange={(event) => resetPage(() => setMinRating(event.target.value))}>{[0, 5, 6, 7, 8, 9].map((rating) => <option key={rating} value={rating}>{rating === 0 ? 'Any rating' : `${rating}+ / 10`}</option>)}</select></label></section>
    <section className="mood-picker" aria-labelledby="mood-heading"><div><h2 id="mood-heading">What’s your mood?</h2><p>Mood genres are combined as alternatives.</p></div><div className="mood-picker__buttons">{MOODS.map((item) => <button key={item.name} type="button" className={mood === item.name ? 'is-selected' : ''} aria-pressed={mood === item.name} onClick={() => resetPage(() => { setMood(mood === item.name ? '' : item.name); setGenre(''); setQuery('') })}>{item.name}</button>)}</div></section>
    <section className="movie-results" aria-live="polite"><div className="movie-results__heading"><h2>{mood ? `${mood} picks` : query ? 'Search results' : 'Popular movies'}</h2>{status === 'ready' && <span>{movies.length} on this page</span>}</div>{searchIsFiltered && <p className="discovery-filter-note">Genre and rating filters apply only to this search-results page; TMDB title search does not offer server-side filtering.</p>}{status === 'loading' && <p className="discovery-message">Finding movies…</p>}{status === 'error' && <p className="discovery-message discovery-message--error" role="alert">{error}</p>}{status === 'empty' && <p className="discovery-message">No movies matched this page. Try another title or loosen a filter.</p>}{status === 'ready' && <div className="movie-grid">{movies.map((movie) => <MovieCard key={movie.id} movie={movie} onSelectMovie={onSelectMovie} />)}</div>}{status === 'ready' && totalPages > 1 && <nav className="pagination" aria-label="Results pages"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></nav>}</section>
    <footer className="tmdb-attribution"><p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p><p>VITE_TMDB_API_KEY is visible in browser bundles. This is a local educational prototype, not a production-safe configuration.</p></footer>
  </main>
}

export default MovieDiscovery
