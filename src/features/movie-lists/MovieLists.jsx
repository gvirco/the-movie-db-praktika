import { useEffect, useState } from 'react'
import {
  createMovieList,
  createSavedMovie,
  deleteMovieList,
  deleteSavedMovie,
  getMovieLists,
  getSavedMovies,
  updateMovieList,
  updateSavedMovie,
} from './api'
import './movie-lists.css'

export default function MovieLists({ userId, onSelectList, refreshKey }) {
  const [lists, setLists] = useState([])
  const [selectedList, setSelectedList] = useState('')
  const [movies, setMovies] = useState([])
  const [newListName, setNewListName] = useState('')
  const [movieId, setMovieId] = useState('')
  const [editingList, setEditingList] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadLists() {
    if (!userId) {
      setLists([])
      setSelectedList('')
      setMovies([])
      return
    }
    const rows = await getMovieLists(userId)
    setLists(rows)
    if (selectedList && !rows.some((list) => String(list.id) === String(selectedList))) {
      setSelectedList('')
      setMovies([])
    }
  }

  async function loadMovies(listId) {
    setMovies(listId ? await getSavedMovies(listId) : [])
  }

  useEffect(() => {
    Promise.resolve().then(() => loadLists()).catch((cause) => setError(cause.message))
    // A parent can request a fresh list read after another feature changes data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshKey])

  useEffect(() => {
    Promise.resolve().then(() => loadMovies(selectedList)).catch((cause) => setError(cause.message))
  }, [selectedList])

  function run(action, successMessage) {
    setBusy(true)
    setError('')
    setMessage('')
    action()
      .then(async () => {
        await loadLists()
        await loadMovies(selectedList)
        setMessage(successMessage)
      })
      .catch((cause) => setError(cause.message || 'The request could not be completed.'))
      .finally(() => setBusy(false))
  }

  function selectList(listId) {
    setSelectedList(listId)
    onSelectList?.(lists.find((list) => String(list.id) === String(listId)) || null)
  }

  function addList(event) {
    event.preventDefault()
    run(async () => {
      const created = await createMovieList({ userId, name: newListName })
      setNewListName('')
      if (created?.id) selectList(String(created.id))
    }, 'List created.')
  }

  function renameList(event) {
    event.preventDefault()
    const list = lists.find((item) => String(item.id) === String(selectedList))
    if (!list) return
    run(() => updateMovieList(list.id, { name: event.currentTarget.elements.name.value }), 'List renamed.')
    setEditingList(false)
  }

  function removeList() {
    const list = lists.find((item) => String(item.id) === String(selectedList))
    if (!list) return
    const prompt = movies.length
      ? `Delete “${list.name}” and its ${movies.length} saved movie(s)? This cannot be undone.`
      : `Delete “${list.name}”?`
    if (!window.confirm(prompt)) return
    run(async () => {
      for (const movie of movies) await deleteSavedMovie(movie.id)
      await deleteMovieList(list.id)
      setSelectedList('')
      setMovies([])
      onSelectList?.(null)
    }, 'List deleted.')
  }

  function addMovie(event) {
    event.preventDefault()
    run(async () => {
      await createSavedMovie({ listId: selectedList, tmdbId: movieId })
      setMovieId('')
    }, 'Movie added to your list.')
  }

  function saveMovie(movie, changes) {
    run(() => updateSavedMovie(movie.id, changes), 'Movie details saved.')
  }

  function removeMovie(movie) {
    if (!window.confirm(`Remove TMDB movie ${movie.tmdbId} from this list?`)) return
    run(() => deleteSavedMovie(movie.id), 'Movie removed.')
  }

  return (
    <section className="movie-lists" aria-labelledby="movie-lists-title">
      <header className="movie-lists__header">
        <div>
          <p className="movie-lists__eyebrow">YOUR COLLECTION</p>
          <h2 id="movie-lists-title">Movie lists</h2>
        </div>
        <span className="movie-lists__count">{lists.length} {lists.length === 1 ? 'list' : 'lists'}</span>
      </header>

      {error && <p className="movie-lists__notice movie-lists__notice--error" role="alert">{error}</p>}
      {message && <p className="movie-lists__notice movie-lists__notice--success" role="status">{message}</p>}

      <div className="movie-lists__layout">
        <aside className="movie-lists__sidebar">
          <form className="movie-lists__create" onSubmit={addList}>
            <label htmlFor="new-list-name">Create a list</label>
            <div className="movie-lists__input-row">
              <input id="new-list-name" value={newListName} onChange={(event) => setNewListName(event.target.value)} placeholder="e.g. Weekend picks" required />
              <button type="submit" disabled={busy || !userId} aria-label="Create list">+</button>
            </div>
          </form>
          {!userId && <p className="movie-lists__hint">Enter a user ID in the preview to load lists.</p>}
          <nav className="movie-lists__nav" aria-label="Your movie lists">
            {lists.map((list) => (
              <button className={String(list.id) === String(selectedList) ? 'is-active' : ''} key={list.id} onClick={() => selectList(String(list.id))}>
                <span>{list.name}</span><span aria-hidden="true">›</span>
              </button>
            ))}
            {userId && !lists.length && <p className="movie-lists__hint">No lists yet. Create your first one above.</p>}
          </nav>
        </aside>

        <div className="movie-lists__content">
          {selectedList ? (
            <>
              <div className="movie-lists__list-heading">
                <div>
                  {editingList ? (
                    <form onSubmit={renameList} className="movie-lists__rename">
                      <input name="name" defaultValue={lists.find((list) => String(list.id) === String(selectedList))?.name} aria-label="New list name" required />
                      <button className="movie-lists__text-button" type="submit">Save</button>
                    </form>
                  ) : <h3>{lists.find((list) => String(list.id) === String(selectedList))?.name}</h3>}
                  <p>{movies.length} saved {movies.length === 1 ? 'movie' : 'movies'}</p>
                </div>
                <div className="movie-lists__actions">
                  <button className="movie-lists__text-button" onClick={() => setEditingList(!editingList)}>{editingList ? 'Cancel' : 'Rename'}</button>
                  <button className="movie-lists__text-button movie-lists__text-button--danger" onClick={removeList}>Delete list</button>
                </div>
              </div>

              <form className="movie-lists__add-movie" onSubmit={addMovie}>
                <label htmlFor="tmdb-id">Add a movie by TMDB ID</label>
                <div className="movie-lists__input-row">
                  <input id="tmdb-id" inputMode="numeric" value={movieId} onChange={(event) => setMovieId(event.target.value)} placeholder="For example, 550" required />
                  <button type="submit" disabled={busy}>Add movie</button>
                </div>
              </form>

              <div className="movie-lists__movies">
                {movies.map((movie) => <MovieCard key={movie.id} movie={movie} disabled={busy} onSave={saveMovie} onRemove={removeMovie} />)}
                {!movies.length && <div className="movie-lists__empty"><span>✳</span><h4>This list is ready for a movie</h4><p>Add one with its TMDB ID to get started.</p></div>}
              </div>
            </>
          ) : (
            <div className="movie-lists__empty movie-lists__empty--welcome"><span>✳</span><h3>Make room for movie night</h3><p>Create a list, then save movies you want to watch or have seen.</p></div>
          )}
        </div>
      </div>
    </section>
  )
}

function MovieCard({ movie, disabled, onSave, onRemove }) {
  const [rating, setRating] = useState(movie.rating ?? '')
  const [notes, setNotes] = useState(movie.notes ?? '')

  return (
    <article className="movie-lists__movie-card">
      <div className="movie-lists__movie-top">
        <div className="movie-lists__movie-icon">▶</div>
        <div className="movie-lists__movie-title"><h4>TMDB movie {movie.tmdbId}</h4><span>ID {movie.tmdbId}</span></div>
        <button className="movie-lists__remove" onClick={() => onRemove(movie)} aria-label={`Remove movie ${movie.tmdbId}`} disabled={disabled}>×</button>
      </div>
      <div className="movie-lists__movie-fields">
        <label>Status<select value={movie.status} onChange={(event) => onSave(movie, { status: event.target.value })} disabled={disabled}><option>Want to Watch</option><option>Watched</option></select></label>
        <label>My rating<input type="number" min="1" max="10" step="1" value={rating} placeholder="1–10" onChange={(event) => setRating(event.target.value)} onBlur={() => String(rating) !== String(movie.rating ?? '') && onSave(movie, { rating })} disabled={disabled} /></label>
      </div>
      <label className="movie-lists__notes">Notes<textarea value={notes} rows="2" placeholder="Add a personal note…" onChange={(event) => setNotes(event.target.value)} onBlur={() => notes !== (movie.notes ?? '') && onSave(movie, { notes })} disabled={disabled} /></label>
    </article>
  )
}
